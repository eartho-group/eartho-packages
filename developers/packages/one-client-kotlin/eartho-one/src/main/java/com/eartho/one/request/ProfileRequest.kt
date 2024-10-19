package com.eartho.one.request

import com.eartho.one.EarthoException
import com.eartho.one.authentication.AuthenticationException
import com.eartho.one.callback.Callback
import com.eartho.one.result.Authentication
import com.eartho.one.result.Credentials
import com.eartho.one.result.User

/**
 * Request to fetch a profile after a successful authentication with Eartho Authentication API
 */
public class ProfileRequest
/**
 * @param authenticationRequest the request that will output a pair of credentials
 * @param userInfoRequest       the /userinfo request that will be wrapped
 */(
    private val authenticationRequest: AuthenticationRequest,
    private val userInfoRequest: Request<User, AuthenticationException>
) : Request<Authentication, AuthenticationException> {
    /**
     * Adds additional parameters for the login request
     *
     * @param parameters as a non-null dictionary
     * @return itself
     */
    override fun addParameters(parameters: Map<String, String>): ProfileRequest {
        authenticationRequest.addParameters(parameters)
        return this
    }

    override fun addParameter(name: String, value: String): ProfileRequest {
        authenticationRequest.addParameter(name, value)
        return this
    }

    /**
     * Adds a header to the request, e.g. "Authorization"
     *
     * @param name  of the header
     * @param value of the header
     * @return itself
     * @see [ProfileRequest]
     */
    override fun addHeader(name: String, value: String): ProfileRequest {
        authenticationRequest.addHeader(name, value)
        return this
    }

    /**
     * Set the scope used to authenticate the user
     *
     * @param scope value
     * @return itself
     */
    public fun setScope(scope: String): ProfileRequest {
        authenticationRequest.setScope(scope)
        return this
    }

    /**
     * Set the connection used to authenticate
     *
     * @param connection name
     * @return itself
     */
    public fun setConnection(connection: String): ProfileRequest {
        authenticationRequest.setConnection(connection)
        return this
    }

    /**
     * Starts the log in request and then fetches the user's profile
     *
     * @param callback called on either success or failure
     */
    override fun start(callback: Callback<Authentication, AuthenticationException>) {
        authenticationRequest.start(object : Callback<Credentials, AuthenticationException> {
            override fun onSuccess(credentials: Credentials) {
                userInfoRequest
                    .addHeader(HEADER_AUTHORIZATION, "Bearer " + credentials.idToken)
                    .start(object : Callback<User, AuthenticationException> {
                        override fun onSuccess(profile: User) {
                            callback.onSuccess(Authentication(profile, credentials))
                        }

                        override fun onFailure(error: AuthenticationException) {
                            callback.onFailure(error)
                        }
                    })
            }

            override fun onFailure(error: AuthenticationException) {
                callback.onFailure(error)
            }
        })
    }

    /**
     * Logs in the user with Eartho and fetches it's profile.
     *
     * @return authentication object containing the user's tokens and profile
     * @throws EarthoException when either authentication or profile fetch fails
     */
    @Throws(EarthoException::class)
    override fun execute(): Authentication {
        val credentials = authenticationRequest.execute()
        val profile = userInfoRequest
            .addHeader(HEADER_AUTHORIZATION, "Bearer " + credentials.idToken)
            .execute()
        return Authentication(profile, credentials)
    }

    private companion object {
        private const val HEADER_AUTHORIZATION = "Authorization"
    }
}