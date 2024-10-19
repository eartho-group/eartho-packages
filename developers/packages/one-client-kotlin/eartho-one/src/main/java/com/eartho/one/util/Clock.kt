package com.eartho.one.util

/**
 * The clock used for verification purposes.
 *
 * @see com.eartho.one.authentication.storage.SecureCredentialsManager
 *
 * @see com.eartho.one.authentication.storage.CredentialsManager
 */
public interface Clock {
    /**
     * Returns the current time in milliseconds (epoch).
     *
     * @return the current time in milliseconds.
     */
    public fun getCurrentTimeMillis(): Long
}