package com.eartho.one.authentication

import androidx.annotation.VisibleForTesting
import com.eartho.one.EarthoOneConfig
import com.eartho.one.EarthoException
import com.eartho.one.request.*
import com.eartho.one.request.internal.*
import com.eartho.one.request.internal.GsonAdapter.Companion.forMap
import com.eartho.one.result.Credentials
import com.google.gson.Gson
import okhttp3.HttpUrl.Companion.toHttpUrl
import java.io.IOException
import java.io.Reader

/**
 * API client for Eartho Authentication API.
 * ```
 * val config = EarthoOneConfig("YOUR_CLIENT_ID")
 * val client = AuthenticationAPIClient(config)
 * ```
 *
 * @see [Auth API docs]()
 */
public class AuthenticationAPIClient @VisibleForTesting(otherwise = VisibleForTesting.PRIVATE) internal constructor(
    private val earthoOneConfig: EarthoOneConfig,
    private val factory: RequestFactory<AuthenticationException>,
    private val gson: Gson
) {

    /**
     * Creates a new API client instance providing Eartho account info.
     *
     * Example usage:
     *
     * ```
     * val config = EarthoOneConfig("YOUR_CLIENT_ID")
     * val client = AuthenticationAPIClient(config)
     * ```
     * @param earthoOneConfig account information
     */
    public constructor(earthoOneConfig: EarthoOneConfig) : this(
        earthoOneConfig,
        RequestFactory<AuthenticationException>(earthoOneConfig.networkingClient, createErrorAdapter()),
        GsonProvider.gson
    )

    public val clientId: String
        get() = earthoOneConfig.clientId
    public val baseURL: String
        get() = earthoOneConfig.getDomainUrl()

    /**
     * Returns the information of the user associated with the given access_token.
     *
     * Example usage:
     * ```
     * client.userInfo("{access_token}")
     *     .start(object: Callback<UserProfile, AuthenticationException> {
     *         override fun onSuccess(result: UserProfile) { }
     *         override fun onFailure(error: AuthenticationException) { }
     * })
     *```
     *
     * @param accessToken used to fetch it's information
     * @return a request to start
     */
//    public fun userInfo(accessToken: String): Request<UserProfile, AuthenticationException> {
//        return profileRequest()
//            .addHeader(HEADER_AUTHORIZATION, "Bearer $accessToken")
//    }

    /**
     * Request the revoke of a given refresh_token. Once revoked, the refresh_token cannot be used to obtain new tokens.
     * Your Eartho Application Type should be set to 'Native' and Token Endpoint Authentication Method must be set to 'None'.
     *
     * Example usage:
     *
     * ```
     * client.revokeToken("{refresh_token}")
     *     .start(object: Callback<Void?, AuthenticationException> {
     *         override fun onSuccess(result: Void?) { }
     *         override fun onFailure(error: AuthenticationException) { }
     * })
     * ```
     *
     * @param refreshToken the token to revoke
     * @return a request to start
     */
    public fun revokeToken(refreshToken: String): Request<Void?, AuthenticationException> {
        val parameters = ParameterBuilder.newBuilder()
            .setClientId(clientId)
            .set(TOKEN_KEY, refreshToken)
            .asDictionary()
        val url = earthoOneConfig.getAuthUrl().toHttpUrl().newBuilder()
            .addPathSegment(ACCESS_PATH)
            .addPathSegment(OAUTH_PATH)
            .addPathSegment(REVOKE_PATH)
            .build()
        return factory.post(url.toString())
            .addParameters(parameters)
    }

    /**
     * Requests new Credentials using a valid Refresh Token. The received token will have the same audience and scope as first requested.
     *
     * This method will use the /oauth/token endpoint with the 'refresh_token' grant, and the response will include an id_token and an access_token if 'openid' scope was requested when the refresh_token was obtained.
     * Additionally, if the application has Refresh Token Rotation configured, a new one-time use refresh token will also be included in the response.
     *
     * The scope of the newly received Access Token can be reduced sending the scope parameter with this request.
     *
     * Example usage:
     * ```
     * client.renewAuth("{refresh_token}")
     *     .addParameter("scope", "openid profile email")
     *     .start(object: Callback<Credentials, AuthenticationException> {
     *         override fun onSuccess(result: Credentials) { }
     *         override fun onFailure(error: AuthenticationException) { }
     * })
     * ```
     *
     * @param refreshToken used to fetch the new Credentials.
     * @return a request to start
     */
    public fun renewAuth(refreshToken: String): Request<Credentials, AuthenticationException> {
        val parameters = ParameterBuilder.newBuilder()
            .setClientId(clientId)
            .setRefreshToken(refreshToken)
            .setGrantType(ParameterBuilder.GRANT_TYPE_REFRESH_TOKEN)
            .asDictionary()
        val url = earthoOneConfig.getAuthUrl().toHttpUrl().newBuilder()
            .addPathSegment(ACCESS_PATH)
            .addPathSegment(OAUTH_PATH)
            .addPathSegment(REFRESH_TOKEN_PATH)
            .build()
        val credentialsAdapter = GsonAdapter(
            Credentials::class.java, gson
        )
        return factory.post(url.toString(), credentialsAdapter)
            .addParameters(parameters)
    }

    /**
     * Fetch the token information from Eartho, using the authorization_code grant type
     * The authorization code received from the Eartho server and the code verifier used
     * to generate the challenge sent to the /authorize call must be provided.
     *
     * Example usage:
     *
     * ```
     * client
     *     .token("authorization code", "code verifier", "redirect_uri")
     *     .start(object: Callback<Credentials, AuthenticationException> {...})
     * ```
     *
     * @param authorizationCode the authorization code received from the /authorize call.
     * @param codeVerifier      the code verifier used to generate the code challenge sent to /authorize.
     * @param redirectUri       the uri sent to /authorize as the 'redirect_uri'.
     * @return a request to obtain access_token by exchanging an authorization code.
     */
    public fun token(
        authorizationCode: String,
        codeVerifier: String,
        redirectUri: String,
        accessId: String,
    ): Request<Credentials, AuthenticationException> {
        val parameters = ParameterBuilder.newBuilder()
            .setClientId(clientId)
            .setGrantType(ParameterBuilder.GRANT_TYPE_AUTHORIZATION_CODE)
            .set(OAUTH_CODE_KEY, authorizationCode)
            .set(REDIRECT_URI_KEY, redirectUri)
            .set(ACCESS_ID, accessId)
            .set("code_verifier", codeVerifier)
            .asDictionary()
        val url = earthoOneConfig.getAuthUrl().toHttpUrl().newBuilder()
            .addPathSegment(ACCESS_PATH)
            .addPathSegment(OAUTH_PATH)
            .addPathSegment(TOKEN_PATH)
            .build()
        val credentialsAdapter: JsonAdapter<Credentials> = GsonAdapter(
            Credentials::class.java, gson
        )
        val request = factory.post(url.toString(), credentialsAdapter)
        request.addParameters(parameters)
        return request
    }

    private companion object {
        private const val OAUTH_CODE_KEY = "code"
        private const val REDIRECT_URI_KEY = "redirect_uri"
        private const val TOKEN_KEY = "token"
        private const val ACCESS_ID = "access_id"

        private const val ACCESS_PATH = "access"
        private const val OAUTH_PATH = "oauth"
        private const val TOKEN_PATH = "token"
        private const val REFRESH_TOKEN_PATH = "refreshtoken"
        private const val REVOKE_PATH = "revoke"
        private const val HEADER_AUTHORIZATION = "Authorization"

        private fun createErrorAdapter(): ErrorAdapter<AuthenticationException> {
            val mapAdapter = forMap(GsonProvider.gson)
            return object : ErrorAdapter<AuthenticationException> {
                override fun fromRawResponse(
                    statusCode: Int,
                    bodyText: String,
                    headers: Map<String, List<String>>
                ): AuthenticationException {
                    return AuthenticationException(bodyText, statusCode)
                }

                @Throws(IOException::class)
                override fun fromJsonResponse(
                    statusCode: Int,
                    reader: Reader
                ): AuthenticationException {
                    val values = mapAdapter.fromJson(reader)
                    return AuthenticationException(values, statusCode)
                }

                override fun fromException(cause: Throwable): AuthenticationException {
                    return AuthenticationException(
                        "Something went wrong",
                        EarthoException(
                            "Something went wrong",
                            cause
                        )
                    )
                }
            }
        }
    }

    init {
        val earthoUserAgent = earthoOneConfig.earthoUserAgent
        factory.setEarthoClientInfo(earthoUserAgent.value)
    }
}