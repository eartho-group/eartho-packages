import EarthoOne

@objc(EarthoModule)
class EarthoModule: NSObject {
    var earthoOne : EarthoOne?

    @objc(initEartho:withB:withC:withResolver:withRejecter:)
    func initEartho(
        clientId: String, 
        clientSecret: String,
        enabledProviders: NSArray?, 
        resolve:RCTPromiseResolveBlock,
        reject:RCTPromiseRejectBlock) -> Void {
        earthoOne = EarthoOne(clientId: clientId, clientSecret: clientSecret, enabledProviders: (enabledProviders as? [String]))
        earthoOne?.start()
    }

    @objc(connectWithRedirect:withResolver:withRejecter:)
    func connectWithRedirect(
        accessId: String, 
        resolve: @escaping RCTPromiseResolveBlock,
        reject:@escaping RCTPromiseRejectBlock) -> Void {
         guard let earthoOne = earthoOne else {
                reject("ConnectFailure", "SDK is not initalized. please call init",nil)
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
                resolve(result)
            } catch {
                reject("ConnectFailure", "Failure Connect With EarthoOne", nil)
            }
        },
        onFailure: { WebAuthError in
            reject("ConnectFailure", "Failure Connect With EarthoOne", WebAuthError)
        })
    }

    @objc(getIdToken:withResolver:withRejecter:)
    func getIdToken(
        a:String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock) -> Void {
        guard let earthoOne = earthoOne else {
            reject("CredentialsFailure", "SDK is not initalized. please call init",nil)
            return
        }
        earthoOne.getIdToken(onSuccess: { credentials in
            resolve(credentials.idToken)
        },
        onFailure: { WebAuthError in
            reject("CredentialsFailure", "Failure getIdToken", WebAuthError)
        })
    }

    @objc(getUser:withResolver:withRejecter:)
    func getUser(
        a:String,
        resolve: RCTPromiseResolveBlock,
        reject: RCTPromiseRejectBlock) -> Void {
        guard let earthoOne = earthoOne else {
            reject("ConnectFailure", "SDK is not initalized. please call init", nil)
            return
        }
        do {
            let credentials = earthoOne.getUser();
            guard credentials != nil else {
                resolve(nil)
                return
            }

            let dataa = UserResult(
                uid: credentials?.uid as? String, 
                displayName: credentials?.displayName as? String, 
                email: credentials?.email as? String, 
                photoURL: credentials?.photoURL as? String, 
                firstName: credentials?.firstName as? String, 
                lastName: credentials?.lastName as? String, 
                phone: credentials?.phone as? String, 
                providerSource: credentials?.providerSource as? String)

            let encoder = JSONEncoder()
            let json = try encoder.encode(dataa)
            let result = String(data: json, encoding: .utf8)!
            resolve(result)
            } catch {
            reject("GetUserFailure", "Failure Get User Data", error)
        }
    }

    @objc(disconnect:withResolver:withRejecter:)
    func disconnect(
        a:String,
        resolve:RCTPromiseResolveBlock,
        reject:RCTPromiseRejectBlock) -> Void {
             guard let earthoOne = earthoOne else {
                           reject("ConnectFailure", "SDK is not initalized. please call init", nil)
                return
            }
        earthoOne.logout();
        resolve("")
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
           var providerSource: String?
       }
}
