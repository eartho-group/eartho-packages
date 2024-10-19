package com.eartho.one.authentication.storage

import com.eartho.one.EarthoException

/**
 * Represents an error raised by the [CredentialsManager].
 */
public class CredentialsManagerException internal constructor(
    message: String,
    cause: Throwable? = null
) : EarthoException(message, cause) {

    /**
     * Returns true when this Android device doesn't support the cryptographic algorithms used
     * to handle encryption and decryption, false otherwise.
     *
     * @return whether this device is compatible with [SecureCredentialsManager] or not.
     */
    public val isDeviceIncompatible: Boolean
        get() = cause is IncompatibleDeviceException
}