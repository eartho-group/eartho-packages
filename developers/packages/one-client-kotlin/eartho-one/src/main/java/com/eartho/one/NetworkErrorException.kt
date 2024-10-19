package com.eartho.one

/**
 * Exception that represents a failure caused when attempting to execute a network request
 */
public class NetworkErrorException(cause: Throwable) :
    EarthoException("Failed to execute the network request", cause)