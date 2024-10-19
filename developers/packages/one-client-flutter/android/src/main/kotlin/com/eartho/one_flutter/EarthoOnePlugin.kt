package com.eartho.one_flutter

import android.app.Activity
import android.content.Context
import androidx.annotation.NonNull
import com.eartho.one.EarthoOne
import com.eartho.one.EarthoOneConfig
import com.eartho.one.request.DefaultClient

import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.MethodChannel.MethodCallHandler
import io.flutter.plugin.common.MethodChannel.Result

import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import java.lang.Exception
import com.google.gson.Gson;

/** EarthoOnePlugin */
class EarthoOnePlugin : FlutterPlugin, MethodCallHandler, ActivityAware {
    /// The MethodChannel that will the communication between Flutter and native Android
    ///
    /// This local reference serves to register the plugin with the Flutter Engine and unregister it
    /// when the Flutter Engine is detached from the Activity
    private lateinit var channel: MethodChannel
    private lateinit var context: Context;
    private var activity: Activity? = null;

    private lateinit var config: EarthoOneConfig
    private lateinit var earthoOne: EarthoOne

    override fun onAttachedToEngine(@NonNull flutterPluginBinding: FlutterPlugin.FlutterPluginBinding) {
        channel = MethodChannel(flutterPluginBinding.binaryMessenger, "eartho_one")
        channel.setMethodCallHandler(this)
        this.context = flutterPluginBinding.applicationContext
    }

    override fun onMethodCall(@NonNull call: MethodCall, @NonNull result: Result) {
        if (call.method == "getPlatformVersion") {
            result.success("Android ${android.os.Build.VERSION.RELEASE}")
        } else if (call.method == "initEartho") {
            val enabledProviders = call.argument<List<String>>("enabledProviders")?.toTypedArray();

            config = EarthoOneConfig(
                call.argument<String>("clientId")!!,
                call.argument<String>("clientSecret")!!,
                enabledProviders
            )
//            config.networkingClient = DefaultClient(enableLogging = true)
            earthoOne = EarthoOne(activity!!, config)
            earthoOne.init()
        } else if (call.method == "connectWithRedirect") {
            val gson = Gson()
            try {
                earthoOne.connectWithRedirect(
                    accessId = call.argument<String>("accessId")!!,
                    onSuccess = { c ->
                        val data = gson.toJson(c)
                        result.success(data)
                    },
                    onFailure = { f ->
                        if (f.isCanceled) {
                            result.success(null);
                        } else {
                            result.error(
                                "AuthenticationException",
                                f.message + f.cause?.message,
                                ""
                            )
                        }
                    })

            } catch (e: Exception) {
                e.printStackTrace()
                result.error("AuthenticationException", e.message, activity)
            }

//            val mapWithValues = mapOf("idToken" to "Value1", "code" to "Value2")
//            val data = gson.toJson(mapWithValues)
//            result.success(data);

        } else if (call.method == "getIdToken") {
            getIdToken(
                result
            )
        } else if (call.method == "getUser") {
            getUser(
                result
            )
        } else if (call.method == "disconnect") {
            disconnect(
                result
            )
        } else {
            result.notImplemented()
        }
    }

    override fun onDetachedFromEngine(@NonNull binding: FlutterPlugin.FlutterPluginBinding) {
        channel.setMethodCallHandler(null)
    }

    fun getIdToken(@NonNull result: Result) {
        try {
            earthoOne.getIdToken(onSuccess = { c ->
                result.success(c.idToken)
            },
                onFailure = { f ->
                    result.error(
                        "CredentialsException",
                        f.message + f.cause?.message,
                        ""
                    )
                })
        } catch (e: Exception) {
            result.error("CredentialsException", e.message, "")
        }
    }

    fun getUser(@NonNull result: Result) {
        try {
            val user = earthoOne.getUser() ?: return result.success(null);
            val gson = Gson()
            val data = gson.toJson(user)
            result.success(data)
        } catch (e: Exception) {
            result.error("Exception", e.message, "")
        }
    }

    fun disconnect(@NonNull result: Result) {
        try {
            val user = earthoOne.logout()
        } catch (e: Exception) {
            result.error("Exception", e.message, "")
        }
    }

    override fun onAttachedToActivity(binding: ActivityPluginBinding) {
        this.activity = binding.activity
    }

    override fun onDetachedFromActivityForConfigChanges() {
        this.activity = null
    }

    override fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {
        this.activity = binding.activity
    }

    override fun onDetachedFromActivity() {
        this.activity = null
    }
}
