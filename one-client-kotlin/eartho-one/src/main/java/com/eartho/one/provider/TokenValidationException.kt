package com.eartho.one.provider

import com.eartho.one.EarthoException

/**
 * Exception thrown when the validation of the ID token failed.
 */
internal class TokenValidationException @JvmOverloads constructor(
    message: String,
    cause: Throwable? = null
) :
    EarthoException(message, cause)