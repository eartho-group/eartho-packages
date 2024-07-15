import Flutter
import UIKit
import EarthoOne

public class SwiftEarthoOnePlugin: NSObject, FlutterPlugin {

    public static func register(with registrar: FlutterPluginRegistrar) {
        let channel = FlutterMethodChannel(name: "eartho_one", binaryMessenger: registrar.messenger())
        let instance = SwiftEarthoOnePlugin()
        registrar.addMethodCallDelegate(instance, channel: channel)
    }
    
    public override init() {
        
    }
    
    var earthoOne : EarthoOne?
    
    
    public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        switch(call.method) {
            case "getPlatformVersion":
                result("iOS " + UIDevice.current.systemVersion)
            case "initEartho":
                guard let args: [String: Any] = call.arguments as? [String:Any] else {
                    result(FlutterError(code: "invalid-params", message: nil, details: nil))
                    return
                }
                let clientId = args["clientId"] as! String
                let clientSecret = args["clientSecret"] as! String
                            let enabledProviders = args["enabledProviders"] as? [String]
earthoOne = EarthoOne(clientId: clientId, clientSecret: clientSecret, enabledProviders: enabledProviders)
                result("")
            earthoOne?.start()
            case "connectWithRedirect":
                 guard let args: [String: Any] = call.arguments as? [String:Any] else {
                            result(FlutterError(code: "invalid-params", message: nil, details: nil))
                            return
                        }
                let accessId = args["accessId"] as! String
                connectWithRedirect(flutterResult: result, accessId: accessId)
            case "getIdToken":
                getIdToken(flutterResult: result)
            case "getUser":
                getUser(flutterResult: result)
            case "disconnect":
                disconnect(flutterResult: result)
            default:
                print("Method does not exist")
            }
    }

    struct EarthoCredentials: Codable {
        var tokenType: String?
        var expiresIn: Date?
        var refreshToken: String?
        var idToken: String?
        var scope: String?
        var recoveryCode: String?
    }
    
    struct UserResult: Codable {
        var uid: String?
        var displayName: String?
        var email: String?
        var photoURL: String?
        var firstName: String?
        var lastName: String?
        var phone: String?
    }
    
    public func connectWithRedirect(flutterResult: @escaping FlutterResult, accessId: String) {
        guard let earthoOne = earthoOne else {
            flutterResult(FlutterError(code: "ConnectFailure", message: "SDK is not initalized. please call init", details: ""))
                return
            }

        earthoOne.connectWithPopup(
            accessId: accessId,
            onSuccess: { credentials in
                do {
                    let data = EarthoCredentials( tokenType: credentials.tokenType, expiresIn: credentials.expiresIn, refreshToken: credentials.refreshToken, idToken: credentials.idToken, scope: credentials.scope, recoveryCode: credentials.recoveryCode
                    )
                    let encoder = JSONEncoder()
                    let json = try encoder.encode(data)
                    let result = String(data: json, encoding: .utf8)!
                    flutterResult(result)
                } catch {
                    flutterResult(FlutterError(code: "ConnectFailure", message: "Failure Logging In With EarthoOne", details: "Error encoding credentials"))
                }
            },
            onFailure: { error in
                switch error {
                case WebAuthError.userCancelled: // handle WebAuthError
                    flutterResult(nil)
                    default:
                    flutterResult(FlutterError(code: "ConnectFailure", message: "Failure connecting with EarthoOne", details: "WebAuthError"))
                }
                    
            })
        
        
    }
    
    public func getIdToken(flutterResult: @escaping FlutterResult) {
        guard let earthoOne = earthoOne else {
            flutterResult(FlutterError(code: "ConnectFailure", message: "SDK is not initalized. please call init", details: ""))
            return
        }
        earthoOne.getIdToken(
            onSuccess: { credentials in
                flutterResult(credentials.idToken)

            },
            onFailure: { error in
                flutterResult(FlutterError(code: "CredentialsFailure", message: "Failure getIdToken", details: ""))
            }
        )
    }
    
    public func getUser(flutterResult: @escaping FlutterResult) {
        guard let earthoOne = earthoOne else {
            flutterResult(FlutterError(code: "getUser", message: "SDK is not initalized. please call init", details: ""))
                return
            }
        do {
            let credentials = earthoOne.getUser();
            guard credentials != nil else {
                flutterResult(nil)
                return
            }

            let dataa = UserResult(uid: credentials?.uid as! String, displayName: credentials?.displayName as? String, email: credentials?.email as? String, photoURL: credentials?.photoURL as? String, firstName: credentials?.firstName as? String, lastName: "", phone: "")
            let encoder = JSONEncoder()
            let json = try encoder.encode(dataa)
            let result = String(data: json, encoding: .utf8)!
            flutterResult(result)
        } catch {
            flutterResult(FlutterError(code: "getUser", message: "getUser failed", details: "Error encoding user"))
        }
    }
    
    public func disconnect(flutterResult: @escaping FlutterResult) {
        guard let earthoOne = earthoOne else {
            flutterResult(FlutterError(code: "ConnectFailure", message: "SDK is not initalized. please call init", details: ""))
                return
            }
        earthoOne.logout();
    }
}
