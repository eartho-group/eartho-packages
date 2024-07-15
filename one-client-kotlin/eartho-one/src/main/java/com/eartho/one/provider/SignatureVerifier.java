package com.eartho.one.provider;

import android.util.Base64;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.eartho.one.authentication.AuthenticationAPIClient;
import com.eartho.one.authentication.AuthenticationException;
import com.eartho.one.callback.AuthenticationCallback;
import com.eartho.one.callback.Callback;
import com.eartho.one.request.internal.Jwt;

import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.List;
import java.util.Map;

/**
 * Abstract class meant to verify tokens signed with HS256 and RS256 signatures.
 */
abstract class SignatureVerifier {

    private final List<String> supportedAlgorithms;

    SignatureVerifier(List<String> supportedAlgorithms) {
        this.supportedAlgorithms = supportedAlgorithms;
    }

    /**
     * Verifies that the given token's signature is valid, deeming the payload inside it authentic
     *
     * @param token the ID token to have its signature validated
     * @throws TokenValidationException if the signature is not valid
     */
    void verify(@NonNull Jwt token) throws TokenValidationException {
        checkAlgorithm(token.getAlgorithm());
        checkSignature(token.getParts());
    }

    private void checkAlgorithm(String tokenAlgorithm) throws TokenValidationException {
        if (!supportedAlgorithms.contains(tokenAlgorithm) || "none".equalsIgnoreCase(tokenAlgorithm)) {
            if (supportedAlgorithms.size() == 1) {
                throw new TokenValidationException(String.format("Signature algorithm of \"%s\" is not supported. Expected the ID token to be signed with %s.", tokenAlgorithm, supportedAlgorithms.get(0)));
            } else {
                throw new TokenValidationException(String.format("Signature algorithm of \"%s\" is not supported. Expected the ID token to be signed with any of %s.", tokenAlgorithm, supportedAlgorithms));
            }
        }
    }

    abstract protected void checkSignature(@NonNull String[] tokenParts) throws TokenValidationException;


    /**
     * Creates a new SignatureVerifier for Asymmetric algorithm ("RS256"). Signature check will actually happen.
     *
     * @param callback  where to receive the results
     */
    static void forAsymmetricAlgorithm(@Nullable final String publicKey, @NonNull final Callback<SignatureVerifier, TokenValidationException> callback) {
        try {
            String pubKeyPEM = publicKey.replace("-----BEGIN PUBLIC KEY-----", "").replace("-----END PUBLIC KEY-----", "").replace("\n", "");
            byte[] encodedPublicKey = Base64.decode(pubKeyPEM,0);
            X509EncodedKeySpec spec = new X509EncodedKeySpec(encodedPublicKey);
            KeyFactory kf = KeyFactory.getInstance("RSA");
            callback.onSuccess(new AsymmetricSignatureVerifier(kf.generatePublic(spec)));
        } catch (Exception e) {
            e.printStackTrace();
            callback.onFailure(new TokenValidationException("Error creating verifier " + e.getMessage() + ' '));
        }
    }

}
