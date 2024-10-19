package com.eartho.one.result

import com.eartho.one.request.internal.JsonRequired
import com.google.gson.annotations.SerializedName

/**
 * Eartho user created in a Database connection.
 *
 * @see [com.eartho.one.authentication.AuthenticationAPIClient.signUp]
 */
public class DatabaseUser(
    @field:JsonRequired @field:SerializedName("email") public val email: String,
    @field:SerializedName(
        "username"
    ) public val username: String?,
    @field:SerializedName("email_verified") public val isEmailVerified: Boolean
)