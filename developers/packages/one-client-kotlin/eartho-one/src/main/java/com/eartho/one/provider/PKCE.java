package com.eartho.one.provider;

import androidx.annotation.NonNull;
import androidx.annotation.VisibleForTesting;

import com.eartho.one.authentication.AuthenticationAPIClient;
import com.eartho.one.authentication.AuthenticationException;
import com.eartho.one.callback.Callback;
import com.eartho.one.request.Request;
import com.eartho.one.result.Credentials;

import java.util.Map;

/**
 * Performs code exchange according to Proof Key for Code Exchange (PKCE) spec.
 */
class PKCE {
    static final String TAG = PKCE.class.getSimpleName();

    final AuthenticationAPIClient apiClient;
    private final String codeVerifier;
    private final String redirectUri;
    private final String codeChallenge;
    private final Map<String, String> headers;

    /**
     * Creates a new instance of this class with the given AuthenticationAPIClient.
     * The instance should be disposed after a call to getToken().
     *
     * @param apiClient   to get the OAuth Token.
     * @param redirectUri going to be used in the OAuth code request.
     * @param headers     HTTP headers added to the OAuth token request.
     * @throws IllegalStateException when either 'US-ASCII` encoding or 'SHA-256' algorithm is not available.
     * @see #isAvailable()
     */
    public PKCE(@NonNull AuthenticationAPIClient apiClient, String redirectUri, @NonNull Map<String, String> headers) {
        this(apiClient, new AlgorithmHelper(), redirectUri, headers);
    }

    @VisibleForTesting
    PKCE(@NonNull AuthenticationAPIClient apiClient, @NonNull AlgorithmHelper algorithmHelper,
         @NonNull String redirectUri, @NonNull Map<String, String> headers) {
        this.apiClient = apiClient;
        this.redirectUri = redirectUri;
        this.codeVerifier = algorithmHelper.generateCodeVerifier();
        this.codeChallenge = algorithmHelper.generateCodeChallenge(codeVerifier);
        this.headers = headers;
    }

    /**
     * Returns the Code Challenge generated using a Code Verifier.
     *
     * @return the Code Challenge for this session.
     */
    public String getCodeChallenge() {
        return codeChallenge;
    }

    /**
     * Performs a request to the Eartho API to get the OAuth Token and end the PKCE flow.
     * The instance of this class must be disposed after this method is called.
     *
     * @param authorizationCode received in the call to /authorize with a "grant_type=code"
     * @param callback          to notify the result of this call to.
     */
    public void getToken(String authorizationCode, String accessId, @NonNull final Callback<Credentials, AuthenticationException> callback) {
        Request<Credentials, AuthenticationException> tokenRequest = apiClient.token(authorizationCode, codeVerifier, redirectUri, accessId);
        for (Map.Entry<String, String> entry : headers.entrySet()) {
            tokenRequest.addHeader(entry.getKey(), entry.getValue());
        }
        tokenRequest.start(callback);
    }

    /**
     * Checks if this device is capable of using the PKCE flow when performing calls to the
     * /authorize endpoint.
     *
     * @return if this device can use PKCE flow or not.
     */
    static boolean isAvailable() {
        return isAvailable(new AlgorithmHelper());
    }

    @VisibleForTesting
    static boolean isAvailable(@NonNull AlgorithmHelper algorithmHelper) {
        try {
            byte[] input = algorithmHelper.getASCIIBytes("test");
            algorithmHelper.getSHA256(input);
        } catch (Exception ignored) {
            return false;
        }
        return true;
    }
}
