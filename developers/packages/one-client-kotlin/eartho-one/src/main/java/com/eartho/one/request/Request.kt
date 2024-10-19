package com.eartho.one.request

import com.eartho.one.EarthoException
import com.eartho.one.callback.Callback

/**
 * Defines a request that can be started
 *
 * @param <T> the type this request will return on success.
 * @param <U> the [EarthoException] type this request will return on failure.
</U></T> */
public interface Request<T, U : EarthoException> {
    /**
     * Performs an async HTTP request against Eartho API
     *
     * @param callback called either on success or failure
     */
    public fun start(callback: Callback<T, U>)

    /**
     * Executes the HTTP request against Eartho API (blocking the current thread)
     *
     * @return the response on success
     * @throws EarthoException on failure
     */
    @Throws(EarthoException::class)
    public fun execute(): T

    /**
     * Add parameters to the request as a Map of Object with the keys as String
     *
     * @param parameters to send with the request
     * @return itself
     */
    public fun addParameters(parameters: Map<String, String>): Request<T, U>

    /**
     * Add parameter to the request with a given name
     *
     * @param name  of the parameter
     * @param value of the parameter
     * @return itself
     */
    public fun addParameter(name: String, value: String): Request<T, U>

    /**
     * Adds an additional header for the request
     *
     * @param name  of the header
     * @param value of the header
     * @return itself
     */
    public fun addHeader(name: String, value: String): Request<T, U>
}