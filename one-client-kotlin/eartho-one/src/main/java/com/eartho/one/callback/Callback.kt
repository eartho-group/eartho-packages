package com.eartho.one.callback

import com.eartho.one.EarthoException

/**
 * Interface for all callbacks used with Eartho API clients
 */
public interface Callback<T, U : EarthoException> {

    /**
     * Method called on success with the result.
     *
     * @param result Request result
     */
    public fun onSuccess(result: T)

    /**
     * Method called on Eartho API request failure
     *
     * @param error The reason of the failure
     */
    public fun onFailure(error: U)
}