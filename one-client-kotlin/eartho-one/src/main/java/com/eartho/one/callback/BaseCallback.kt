package com.eartho.one.callback

import com.eartho.one.EarthoException

/**
 * Legacy interface to handle successful callbacks. Use {@linkplain Callback} instead.
 */
@Deprecated(
    message = "The contract of this interface has been migrated to the Callback interface",
    replaceWith = ReplaceWith("Callback")
)
public interface BaseCallback<T, U : EarthoException> : Callback<T, U>