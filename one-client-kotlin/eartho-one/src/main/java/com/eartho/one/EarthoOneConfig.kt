package com.eartho.one

import android.content.Context
import com.eartho.one.request.DefaultClient
import com.eartho.one.request.NetworkingClient
import com.eartho.one.util.EarthoUserAgent
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import java.util.*

/**
 * Represents your Eartho account information (clientId &amp; domain),
 * and it's used to obtain clients for Eartho's APIs.
 *
 * ```
 * val config = EarthoOneConfig("YOUR_CLIENT_ID","YOUR_CLIENT_SECRET")
 *```
 *
 * @param clientId            of your Eartho application
 * @param domain              of your Eartho account
 */
public open class EarthoOneConfig @JvmOverloads constructor(
    /**
     * @return your Eartho application client identifier
     */
    val clientId: String,
    val clientSecret: String,
    val enabledProviders: Array<String>? = null // Use EarthoAuthProvider
) {
    private val domainUrl: HttpUrl?

    private val domain: String = "https://one.eartho.world/"

    /**
     * @return Eartho user agent information sent in every request
     */
    public var earthoUserAgent: EarthoUserAgent

    /**
     * The networking client instance used to make HTTP requests.
     */
    public var networkingClient: NetworkingClient = DefaultClient()

    /**
     * @return your Eartho account domain url
     */
    public fun getDomainUrl(): String {
        return domain
    }

    public fun getAuthUrl(): String {
        return "https://api.eartho.world"
    }

    /**
     * Obtain the authorize URL for the current domain
     *
     * @return Url to call to perform the web flow of OAuth
     */
    public val authorizeUrl: String
        get() = domainUrl!!.newBuilder()
            .addEncodedPathSegment("connect")
            .build()
            .toString()

    /**
     * Obtain the logout URL for the current domain
     *
     * @return Url to call to perform the web logout
     */
    public val logoutUrl: String
        get() = domainUrl!!.newBuilder()
            .addEncodedPathSegment("logout")
            .build()
            .toString()

    private fun ensureValidUrl(url: String?): HttpUrl? {
        if (url == null) {
            return null
        }
        val normalizedUrl = url.lowercase(Locale.ROOT)
        require(!normalizedUrl.startsWith("http://")) { "Invalid domain url: '$url'. Only HTTPS domain URLs are supported. If no scheme is passed, HTTPS will be used." }
        val safeUrl =
            if (normalizedUrl.startsWith("https://")) normalizedUrl else "https://$normalizedUrl"
        return safeUrl.toHttpUrlOrNull()
    }

    init {
        domainUrl = ensureValidUrl(domain)
        requireNotNull(domainUrl) { String.format("Invalid domain url: '%s'", domain) }
        earthoUserAgent = EarthoUserAgent()
    }
}

class EarthoAuthProvider {
    companion object{
        const val facebook = "facebook";
        const val google = "google";
        const val twitter = "twitter";

        const val apple = "apple";
        const val github = "github";
        const val microsoft = "microsoft";

        const val vk = "vk";
        const val phone = "phone";
        const val metamask = "metamask";

        const val reddit = "reddit";
        const val snapchat = "snapchat";
        const val yandex = "yandex";
    }
}