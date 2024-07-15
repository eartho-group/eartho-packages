import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import 'eartho_one.dart';

import 'eartho_one_platform_interface.dart';

/// An implementation of [EarthoOnePlatform] that uses method channels.
class MethodChannelEarthoOne extends EarthoOnePlatform {
  /// The method channel used to interact with the native platform.
  @visibleForTesting
  final methodChannel = const MethodChannel('eartho_one');

  @override
  Future<String?> getPlatformVersion() async {
    final version = await methodChannel.invokeMethod<String>('getPlatformVersion');
    return version;
  }

  /// Init the sdk
  @override
  Future<dynamic> initEartho({required String clientId, required String clientSecret, List<String>? enabledProviders}) async {
    await methodChannel.invokeMethod(
        'initEartho', {"clientId": clientId, "clientSecret": clientSecret, "enabledProviders": enabledProviders});
  }

  /// Starts the access flow
  ///
  /// accessId - which access the user should connect to
  /// take this value from creator.eartho.world
  @override
  Future<EarthoCredentials?> connectWithRedirect(String accessId) async {
    final rawJson = await methodChannel
        .invokeMethod('connectWithRedirect', {"accessId": accessId});
    if (rawJson == null) return null;
    final decodedJson = jsonDecode(rawJson);
    return EarthoCredentials.fromJSON(decodedJson);
  }

  /// After user connected, this function returns the id token of the user
  @override
  Future<String> getIdToken() async {
    final rawJson = await methodChannel.invokeMethod('getIdToken');
    // final decodedJson = jsonDecode(rawJson);
    return rawJson;
  }

  /// After user connected, this function returns user object
  @override
  Future<EarthoUser?> getUser() async {
    final rawJson = await methodChannel.invokeMethod('getUser');
    if (rawJson == null) return null;
    final decodedJson = jsonDecode(rawJson);
    return EarthoUser.fromJSON(decodedJson);
  }

  /// Disconnect this user from eartho and clear session
  @override
  Future<dynamic> disconnect() async {
    return await methodChannel.invokeListMethod('disconnect');
  }
}
