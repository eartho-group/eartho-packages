package com.eartho.one.result

import java.io.Serializable
import java.util.*

/**
 * Class that holds the information of a user's profile in Eartho.
 * Used both in [com.eartho.one.management.UsersAPIClient] and [com.eartho.one.authentication.AuthenticationAPIClient].
 */
class User(
    val uid: String?,
    val displayName: String?,
    val photoURL: String?,
    val email: String?,
    val isEmailVerified: Boolean?,
    val firstName: String?,
    val familyName: String?,
    val providerSource: String?,
    private val extraInfo: Map<String, Any>?,
) : Serializable {

    /**
     * Returns extra information of the profile that is not part of the normalized profile
     *
     * @return a map with user's extra information found in the profile
     */
    fun getExtraInfo(): Map<String, Any> {
        return extraInfo?.toMap() ?: emptyMap()
    }
}