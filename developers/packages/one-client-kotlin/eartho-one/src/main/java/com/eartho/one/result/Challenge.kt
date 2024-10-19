package com.eartho.one.result

import com.eartho.one.request.internal.JsonRequired
import com.google.gson.annotations.SerializedName

/**
 * Multi-factor authentication (MFA) challenge
 *
 * @see [com.eartho.one.authentication.AuthenticationAPIClient.multifactorChallenge]
 */
public class Challenge(
    @field:JsonRequired @field:SerializedName("challenge_type")
    public val challengeType: String,

    @field:SerializedName("oob_code")
    public val oobCode: String?,

    @field:SerializedName("binding_method")
    public val bindingMethod: String?
)