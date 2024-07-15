package com.eartho.one_rn

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray

import com.eartho.one.EarthoOne
import com.eartho.one.EarthoOneConfig
import com.eartho.one.request.DefaultClient
import com.google.gson.Gson

class EarthoOneModuleModule(val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private lateinit var config: EarthoOneConfig
  private lateinit var earthoOne: EarthoOne

  override fun getName(): String {
    return "EarthoModule"
  }

  @ReactMethod
  fun initEartho(clientId: String, clientSecret: String, enabledProviders: ReadableArray?, promise: Promise) {
    config = EarthoOneConfig(
      clientId = clientId,
      clientSecret = clientSecret,
      enabledProviders = enabledProviders?.toArrayList()?.map{ it as String }?.toTypedArray()
    )
    // config.networkingClient = DefaultClient(enableLogging = true)
    val activity = getCurrentActivity();
    earthoOne = EarthoOne(activity!!, config)
    earthoOne.init()
    promise.resolve("")
  }

  @ReactMethod
  fun connectWithRedirect(accessId: String, promise: Promise) {
    val gson = Gson()
    try {
      earthoOne.connectWithRedirect(
        accessId = accessId,
        onSuccess = { c ->
          val d = gson.toJson(c)
          promise.resolve(d)
        }, onFailure = { f ->
          promise.reject("AuthenticationException", f.message + f.cause?.message, f)
        })
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("AuthenticationException", e.message, e)
    }
  }

  @ReactMethod
  fun getUser(a: String, promise: Promise) {
    try {
      val user = earthoOne.getUser() ?: return promise.resolve(null);
      val gson = Gson()
      val d = gson.toJson(user)
      promise.resolve(d)
    } catch (e: Exception) {
      promise.reject("Exception", e.message, e)
    }
  }

  @ReactMethod
  fun getIdToken(a: String, promise: Promise) {
    try {
      earthoOne.getIdToken(onSuccess = { c ->
        promise.resolve(c.idToken)
      },
        onFailure = { e ->
          promise.reject("CredentialsException", e.message, e)
        })
    } catch (e: Exception) {
      promise.reject("CredentialsException", e.message, e)
    }
  }

  @ReactMethod
  fun disconnect(a: String, promise: Promise) {
    try {
      val user = earthoOne.logout()
    } catch (e: Exception) {
      promise.reject("Exception", e.message, e)
    }
  }
}
