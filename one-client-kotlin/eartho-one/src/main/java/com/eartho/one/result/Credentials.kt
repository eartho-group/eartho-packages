package com.eartho.one.result

import androidx.annotation.VisibleForTesting
import com.google.gson.annotations.SerializedName
import java.util.*

/**
 * Holds the user's credentials returned by Eartho.
 *
 *  * *idToken*: Identity Token with user information
 *  * *accessToken*: Access Token for Eartho API
 *  * *refreshToken*: Refresh Token that can be used to request new tokens without signing in again
 *  * *type*: The type of the received Access Token.
 *  * *expiresAt*: The token expiration date.
 *  * *scope*: The token's granted scope.
 *
 */
public open class Credentials(
    /**
     * Getter for the Identity Token with user information.
     *
     * @return the Identity Token.
     */
    @field:SerializedName("id_token") public val idToken: String,

    /**
     * Getter for the Refresh Token that can be used to request new tokens without signing in again.
     *
     * @return the Refresh Token.
     */
    @field:SerializedName("refresh_token") public val refreshToken: String?,

    /**
     * Getter for the expiration date of the Access Token.
     * Once expired, the Access Token can no longer be used to access an API and a new Access Token needs to be obtained.
     *
     * @return the expiration date of this Access Token
     */
    @field:SerializedName("expires_at")
    public val expiresAt: Date,

    /**
     * Getter for the access token's granted scope. Only available if the requested scope differs from the granted one.
     *
     * @return the granted scope.
     */
    @field:SerializedName("scope") public val scope: String?
) {

    //TODO this could be removed and the class be a data class instead
    @get:VisibleForTesting(otherwise = VisibleForTesting.PRIVATE)
    internal open val currentTimeInMillis: Long
        get() = System.currentTimeMillis()

    override fun toString(): String {
        return "Credentials(idToken='$idToken', refreshToken=$refreshToken, expiresAt=$expiresAt, scope=$scope)"
    }


}