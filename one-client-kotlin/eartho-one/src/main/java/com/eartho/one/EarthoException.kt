package com.eartho.one

/**
 * Base Exception for any error found during a request to Eartho's API
 */
public open class EarthoException(message: String, cause: Throwable? = null) :
    RuntimeException(message, cause) {

    public companion object {
        public const val UNKNOWN_ERROR: String = "eartho.one.sdk.internal_error.unknown"
        public const val NON_JSON_ERROR: String = "eartho.one.sdk.internal_error.plain"
        public const val EMPTY_BODY_ERROR: String = "eartho.one.sdk.internal_error.empty"
        public const val EMPTY_RESPONSE_BODY_DESCRIPTION: String = "Empty response body"
    }
}