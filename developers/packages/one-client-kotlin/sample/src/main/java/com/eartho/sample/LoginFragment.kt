package com.eartho.sample

import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.eartho.one.EarthoAuthProvider
import com.eartho.one.EarthoOne
import com.eartho.one.EarthoOneConfig
import com.eartho.one.request.DefaultClient
import com.eartho.sample.databinding.FragmentDatabaseLoginBinding

/**
 * A simple [Fragment] subclass as the default destination in the navigation.
 */
class LoginFragment : Fragment() {

    private val config: EarthoOneConfig by lazy {
        val clientId = "x5wNs5h7EiyhxzODBe1X";
        val clientSecret = "-----BEGIN PUBLIC KEY----- MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAya48nKOC9nIiQfayHpkF RkF7QD8PoX6JVhUuQMPY96ybAZYeaQJih8gpn/sqD03DCZmBhaF+UQBzWP14ycax baTD+j0DRF3zdxSk5RognHfcNq++dgr+dPR7jvuTOpX7YdWEdSSnu2XRXjHparwx jw5oTVQbd8IhSecurz/d72d55cWIO7LrmiONdz2unCYnNfT3txJ2TpY1O+8lPlmO GOcbMB67XI+HPviQdSg9q+0xFCbkbgInkCNCRAYol30bT7+jszfoKHTv1+xU22gZ xSH9rnpDS4txvcXDmMBGM6UV3h3RkQFr2BkQJqPXpo82oYv6DvoUIygV+N5vyXUV LQIDAQAB -----END PUBLIC KEY-----"

        // -- REPLACE this credentials with your own Eartho app credentials!
        val account = EarthoOneConfig(clientId, clientSecret)
        // Only enable network traffic logging on production environments!
        account.networkingClient = DefaultClient(enableLogging = true)
        account
    }

    private val earthoOne: EarthoOne by lazy {
        EarthoOne(requireContext(), config)
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val binding = FragmentDatabaseLoginBinding.inflate(inflater, container, false)

        binding.buttonInit.setOnClickListener {
            earthoOne.init();
        }
        binding.buttonWebAuth.setOnClickListener {
            earthoOne.connectWithRedirect("2drlTkv19Alfvu9pEPTP", onSuccess = { result ->
                result.idToken
            });
        }
        binding.buttonFetchUser.setOnClickListener {
            val result = earthoOne.getUser() ?: return@setOnClickListener

            binding.result.text = "Connected\n" + result.displayName
            binding.resultImage.setImageURI(Uri.parse(result.photoURL))
        }
        binding.buttonRefreshCredentials.setOnClickListener {
            earthoOne.getIdToken(onSuccess = { result ->
                result.idToken
            }, forceRefresh = true);
        }
        binding.buttonWebLogout.setOnClickListener {
            earthoOne.logout();
        }
        return binding.root
    }

}