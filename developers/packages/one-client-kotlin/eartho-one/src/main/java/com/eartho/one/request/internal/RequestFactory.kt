package com.eartho.one.request.internal

import androidx.annotation.VisibleForTesting
import com.eartho.one.EarthoException
import com.eartho.one.request.*
import com.eartho.one.util.EarthoUserAgent
import java.io.Reader
import java.util.*

internal class RequestFactory<U : EarthoException> internal constructor(
    private val client: NetworkingClient,
    private val errorAdapter: ErrorAdapter<U>
) {

    private companion object {
        private const val DEFAULT_LOCALE_IF_MISSING = "en_US"
        private const val ACCEPT_LANGUAGE_HEADER = "Accept-Language"
        private const val EARTHO_ONE_CLIENT_INFO_HEADER = EarthoUserAgent.HEADER_NAME

        val defaultLocale: String
            get() {
                val language = Locale.getDefault().toString()
                return if (language.isNotEmpty()) language else DEFAULT_LOCALE_IF_MISSING
            }
    }

    private val baseHeaders = mutableMapOf(Pair(ACCEPT_LANGUAGE_HEADER, defaultLocale))

    fun <T> post(
        url: String,
        resultAdapter: JsonAdapter<T>
    ): Request<T, U> = setupRequest(HttpMethod.POST, url, resultAdapter, errorAdapter)

    fun post(url: String): Request<Void?, U> =
        this.post(url, object : JsonAdapter<Void?> {
            override fun fromJson(reader: Reader): Void? {
                return null
            }
        })

    fun <T> patch(
        url: String,
        resultAdapter: JsonAdapter<T>
    ): Request<T, U> = setupRequest(HttpMethod.PATCH, url, resultAdapter, errorAdapter)

    fun <T> delete(
        url: String,
        resultAdapter: JsonAdapter<T>
    ): Request<T, U> = setupRequest(HttpMethod.DELETE, url, resultAdapter, errorAdapter)

    fun <T> get(
        url: String,
        resultAdapter: JsonAdapter<T>
    ): Request<T, U> = setupRequest(HttpMethod.GET, url, resultAdapter, errorAdapter)

    fun setHeader(name: String, value: String) {
        baseHeaders[name] = value
    }

    fun setEarthoClientInfo(clientInfo: String) {
        baseHeaders[EARTHO_ONE_CLIENT_INFO_HEADER] = clientInfo
    }

    @VisibleForTesting
    fun <T> createRequest(
        method: HttpMethod,
        url: String,
        client: NetworkingClient,
        resultAdapter: JsonAdapter<T>,
        errorAdapter: ErrorAdapter<U>,
        threadSwitcher: ThreadSwitcher
    ): Request<T, U> = BaseRequest(method, url, client, resultAdapter, errorAdapter, threadSwitcher)


    private fun <T> setupRequest(
        method: HttpMethod,
        url: String,
        resultAdapter: JsonAdapter<T>,
        errorAdapter: ErrorAdapter<U>
    ): Request<T, U> {
        val request =
            createRequest(
                method,
                url,
                client,
                resultAdapter,
                errorAdapter,
                CommonThreadSwitcher.getInstance()
            )
        baseHeaders.map { request.addHeader(it.key, it.value) }
        return request
    }

}