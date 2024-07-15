import UIKit
import Flutter
import EarthoOne

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

override func application(_ app: UIApplication,
                  open url: URL,
                   options: [UIApplication.OpenURLOptionsKey: Any]) -> Bool {
     return WebAuthentication.resume(with: url)
 }

}
