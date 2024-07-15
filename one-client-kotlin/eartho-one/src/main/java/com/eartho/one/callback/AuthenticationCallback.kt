package com.eartho.one.callback

import com.eartho.one.authentication.AuthenticationException

public interface AuthenticationCallback<T> : Callback<T, AuthenticationException>