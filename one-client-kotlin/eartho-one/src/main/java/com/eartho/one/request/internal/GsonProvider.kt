package com.eartho.one.request.internal

import androidx.annotation.VisibleForTesting
import com.eartho.one.result.Credentials
import com.eartho.one.result.User
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.reflect.TypeToken
import java.security.PublicKey
import java.text.SimpleDateFormat
import java.util.*

internal object GsonProvider {
    internal val gson: Gson
    private var sdf: SimpleDateFormat
    private const val DATE_FORMAT = "yyyy-MM-DD HH:mm:ss.S"

    init {
        val jwksType = TypeToken.getParameterized(
            Map::class.java,
            String::class.java,
            PublicKey::class.java
        ).type
        gson = GsonBuilder()
            .registerTypeAdapterFactory(JsonRequiredTypeAdapterFactory())
            .registerTypeAdapter(User::class.java,
                UserProfileDeserializer()
            )
            .registerTypeAdapter(Credentials::class.java, CredentialsDeserializer())
            .registerTypeAdapter(jwksType, JwksDeserializer())
            .setDateFormat(DATE_FORMAT)
            .create()
        sdf = SimpleDateFormat(DATE_FORMAT, Locale.US)
    }

    @JvmStatic
    @VisibleForTesting
    fun formatDate(date: Date): String {
        return sdf.format(date)
    }
}