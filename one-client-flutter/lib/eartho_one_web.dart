import 'dart:js_util';

import 'package:eartho_one/web/eartho_one_client.dart';
import 'package:flutter_web_plugins/flutter_web_plugins.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

import 'eartho_one.dart';

import 'eartho_one_platform_interface.dart';
import 'dart:html' as html show window;
import 'web/interop.dart' as interop;

/// A web implementation of the EarthoOnePlatform of the EarthoOne plugin.
class EarthoOneWeb extends EarthoOnePlatform {
  /// Constructs a EarthoOneWeb
  EarthoOneWeb();

  interop.EarthoOneWeb? earthoInstance;

  static void registerWith(Registrar registrar) {
    EarthoOnePlatform.instance = EarthoOneWeb();
  }

  /// Returns a [String] containing the version of the platform.
  @override
  Future<String?> getPlatformVersion() async {
    final version = html.window.navigator.userAgent;
    return version;
  }

  @override
  Future initEartho(
      {required String clientId,
      required String clientSecret,
      List<String>? enabledProviders}) async {
    earthoInstance = await promiseToFuture(interop
        .createEarthoClient(interop.EarthoOneOptions(client_id: clientId)));

    earthoInstance?.handleRedirectCallback();
  }

  @override
  Future<EarthoCredentials?> connectWithRedirect(String accessId) async {
    if(earthoInstance == null)return null;
    final rawJson = await promiseToFuture(earthoInstance
        ?.connectWithRedirect(RedirectConnectOptions(access_id: accessId)));
    if (rawJson == null) return null;
    // final decodedJson = jsonDecode(rawJson);
    return EarthoCredentials.fromJSON(rawJson);
  }

  @override
  Future<EarthoCredentials?> connectWithPopup(String accessId) async {
    if(earthoInstance == null)return null;
    final rawJson = await promiseToFuture(earthoInstance?.connectWithPopup(
        PopupConnectOptions(access_id: accessId), PopupConfigOptions()));
    if (rawJson == null) return null;
    // final decodedJson = jsonDecode(rawJson);
    return EarthoCredentials.fromJSON(rawJson);
  }

  @override
  Future<String?> getIdToken() async {
    try {
      final rawJson = await promiseToFuture(earthoInstance?.getIdToken());
      return rawJson;
    } catch (e) {
      print(e);
      return null;
    }
  }

  @override
  Future<EarthoUser?> getUser() async {
    try {
      if (earthoInstance == null) return null;
      final eToken = await promiseToFuture(earthoInstance?.getIdToken());
      if (eToken == null) return null;
      Map<String, dynamic> decodedToken = JwtDecoder.decode(eToken as String);
      return EarthoUser.fromJSON(decodedToken["user"]);
    } catch (e) {
      print(e);
      return null;
    }
  }
}
