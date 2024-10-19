package com.eartho.one.result

/**
 * The result of a successful authentication against Eartho
 * Contains the logged in user's [Credentials] and [User].
 *
 * @see [com.eartho.one.authentication.AuthenticationAPIClient.getProfileAfter]
 */
public class Authentication(public val profile: User, public val credentials: Credentials)