package com.eartho.one

import android.content.Context
import com.eartho.one.authentication.AuthenticationAPIClient
import com.eartho.one.authentication.AuthenticationException
import com.eartho.one.authentication.storage.CredentialsManager
import com.eartho.one.authentication.storage.CredentialsManagerException
import com.eartho.one.authentication.storage.SharedPreferencesStorage
import com.eartho.one.callback.Callback
import com.eartho.one.provider.WebAuthProvider
import com.eartho.one.request.internal.GsonProvider
import com.eartho.one.result.Credentials
import com.eartho.one.result.User

const val DEFAULT_MIN_TTL = 60 * 30;

class EarthoOne(
    private val context: Context,
    private val config: EarthoOneConfig
) {
    private val authentication: AuthenticationAPIClient by lazy { AuthenticationAPIClient(config) }
    private val manager: CredentialsManager by lazy {
        CredentialsManager(
            authentication,
            SharedPreferencesStorage(context)
        )
    }

    /**
     * Starting the SDK to check the cached token is valid and if not refresh it
     * @param minTt the minimum time in seconds that the access token should last before expiration.
     * @param forceRefresh
     */
    fun init(forceRefresh: Boolean = false, minTtl: Int = DEFAULT_MIN_TTL) {
        getIdToken(forceRefresh = forceRefresh, minTtl = minTtl)
    }

    /**
     * Request user Authentication. The result will be received in the callback.
     * An error is raised if there are no browser applications installed in the device, or if
     * device does not support the necessary algorithms to support Proof of Key Exchange (PKCE)
     * (this is not expected), or if the user closed the browser before completing the authentication.
     *
     * @param accessId The access point id the user is going to connect to. https://creator.eartho.world
     * @param onSuccess to receive the parsed results
     * @param onFailure to receive the parsed errors
     * @see AuthenticationException.isBrowserAppNotAvailable
     * @see AuthenticationException.isPKCENotAvailable
     * @see AuthenticationException.isAuthenticationCanceled
     */
    fun connectWithRedirect(
        accessId: String,
        onSuccess: ((Credentials) -> Unit)? = null,
        onFailure: ((AuthenticationException) -> Unit)? = null
    ) {
        WebAuthProvider.login(config)
            .withAccessId(accessId)
            .start(context, object : Callback<Credentials, AuthenticationException> {
                override fun onSuccess(result: Credentials) {
                    manager.saveCredentials(result)
                    onSuccess?.invoke(result)
                }

                override fun onFailure(error: AuthenticationException) {
                    onFailure?.invoke(error)
                }
            })

    }

    /**
     * Retrieves the user from the storage without refresh
     **/
    fun getUser(): User? {
        val finalIdToken = manager.getOfflineIdToken() ?: return null;
        val decodedIdToken = manager.jwtDecoder.decode(finalIdToken);
        val a = GsonProvider.gson.toJson(decodedIdToken.decodedPayload["user"]);
        val user: User = GsonProvider.gson.fromJson(a, User::class.java);
        return user;
    }

    /**
     * Retrieves the offline credentials from the storage without refresh
     **/
    fun getIdToken(): String? {
        return manager.getOfflineIdToken();
    }

    /**
     * Retrieves the credentials from the storage and refresh them if they have already expired.
     * It will fail with [CredentialsManagerException] if the saved access_token or id_token is null,
     * or if the tokens have already expired and the refresh_token is null.
     *
     * @param minTtl   the minimum time in seconds that the access token should last before expiration.
     * @param forceRefresh
     * @param callback the callback that will receive a valid [Credentials] or the [CredentialsManagerException].
     */
    fun getIdToken(
        onSuccess: ((Credentials) -> Unit)? = null,
        onFailure: ((CredentialsManagerException) -> Unit)? = null,
        forceRefresh: Boolean = false,
        minTtl: Int = DEFAULT_MIN_TTL,
    ) {
        manager.getCredentials(
            null,
            minTtl,
            emptyMap(),
            object : Callback<Credentials, CredentialsManagerException> {
                override fun onSuccess(result: Credentials) {
                    manager.saveCredentials(result)
                    onSuccess?.invoke(result)
                }

                override fun onFailure(error: CredentialsManagerException) {
                    onFailure?.invoke(error)
                }
            },
            forceRefresh
        );
    }

    /**
     * Checks if a non-expired pair of credentials can be obtained from this manager.
     * @return whether there are valid credentials stored on this manager.
     */
    fun isConnected(): Boolean {
        return manager.hasValidCredentials();
    }

    /**
     * Removes the credentials from the storage if present.
     */
    fun logout(
        onSuccess: (() -> Unit)? = null,
        onFailure: ((AuthenticationException) -> Unit)? = null
    ) {
        manager.clearCredentials();
        onSuccess?.invoke();
    }

}