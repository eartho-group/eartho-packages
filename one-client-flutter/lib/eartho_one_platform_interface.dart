import 'package:plugin_platform_interface/plugin_platform_interface.dart';

import 'eartho_one.dart';
import 'eartho_one_method_channel.dart';


abstract class EarthoOnePlatform extends PlatformInterface {
  /// Constructs a EarthoOnePlatform.
  EarthoOnePlatform() : super(token: _token);

  static final Object _token = Object();

  static EarthoOnePlatform _instance = MethodChannelEarthoOne();

  /// The default instance of [EarthoOnePlatform] to use.
  ///
  /// Defaults to [MethodChannelEarthoOne].
  static EarthoOnePlatform get instance => _instance;
  
  /// Platform-specific implementations should set this with their own
  /// platform-specific class that extends [EarthoOnePlatform] when
  /// they register themselves.
  static set instance(EarthoOnePlatform instance) {
    PlatformInterface.verifyToken(instance, _token);
    _instance = instance;
  }

  Future<String?> getPlatformVersion() {
    throw UnimplementedError('platformVersion() has not been implemented.');
  }

  /// Init the sdk
  Future<dynamic> initEartho({required String clientId, required String clientSecret, List<String>? enabledProviders}) async {
    throw UnimplementedError('init() has not been implemented.');
  }

  /// Starts the access flow
  ///
  /// accessId - which access the user should connect to
  /// take this value from creator.eartho.world
  Future<EarthoCredentials?> connectWithRedirect(String accessId) async {
    throw UnimplementedError('connectWithRedirect() has not been implemented.');
  }

  Future<EarthoCredentials?> connectWithPopup(String accessId) async {
    throw UnimplementedError('connectWithPopup() has not been implemented.');
  }

  /// After user connected, this function returns the id token of the user
  Future<String?> getIdToken() async {
    throw UnimplementedError('getIdToken() has not been implemented.');
  }

  /// After user connected, this function returns user object
  Future<EarthoUser?> getUser() async {
    throw UnimplementedError('getUser() has not been implemented.');
  }

  /// Disconnect this user from eartho and clear session
  Future<dynamic> disconnect() async {
    throw UnimplementedError('disconnect() has not been implemented.');
  }

}
