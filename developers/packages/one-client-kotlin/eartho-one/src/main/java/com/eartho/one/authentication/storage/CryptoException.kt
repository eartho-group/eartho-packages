package com.eartho.one.authentication.storage

/**
 * Exception thrown by the [CryptoUtil] class whenever an operation goes wrong.
 */
public open class CryptoException internal constructor(message: String, cause: Throwable? = null) :
    RuntimeException(message, cause)