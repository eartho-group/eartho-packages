package com.eartho.one.authentication.storage;

import com.eartho.one.request.internal.Jwt;

/**
 * Bridge class for decoding JWTs.
 * Used to abstract the implementation for testing purposes.
 */
public class JWTDecoder {

    JWTDecoder() {
    }

   public Jwt decode(String jwt) {
        return new Jwt(jwt);
    }
}
