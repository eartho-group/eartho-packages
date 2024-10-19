import Foundation

/**
 `Result` wrapper for Authentication API operations.
 */
public typealias AuthenticationResult<T> = Result<T, AuthenticationError>

/**
 `Result` wrapper for Management API operations.
 */
public typealias ManagementResult<T> = Result<T, ManagementError>

#if WEB_AUTH_PLATFORM
/**
 `Result` wrapper for Web Auth operations.
 */
public typealias WebAuthResult<T> = Result<T, WebAuthError>
#endif

/**
 `Result` wrapper for Credentials Manager operations.
 */
public typealias CredentialsManagerResult<T> = Result<T, CredentialsManagerError>

public let defaultScope = "email"
public let DEFAULT_MIN_TTL = 60 * 30;


public class EarthoOne {
    public let defaultDomain = "https://one.eartho.world/"
    public let defaultAuthDomain = "https://api.eartho.world/"
    
    private let clientId : String
    private let clientSecret : String
    private let enabledProviders : [String]?
    
    private let credentialsManager : CredentialsManager
    
    public init(clientId : String, clientSecret : String, enabledProviders: [String]? = nil) {
        self.clientId = clientId;
        self.clientSecret = clientSecret;
        self.enabledProviders = enabledProviders;
        
        let auth = EarthoOneAuthentication(clientId: clientId, clientSecret: clientSecret, url: .httpsURL(from: defaultAuthDomain), session: .shared);
        self.credentialsManager = CredentialsManager(authentication: auth);
    }
    /**
    * Starting the SDK to check the cached token is valid and if not refresh it
    * @param minTt the minimum time in seconds that the access token should last before expiration.
    * @param forceRefresh
    */
    public func start(minTTL: Int = DEFAULT_MIN_TTL,
                      forceRefresh : Bool=false){
        self.getIdToken(minTTL : minTTL, forceRefresh: forceRefresh)
    }
    /**
     * Request user Authentication. The result will be received in the callback.
     * An error is raised if there are no browser applications installed in the device, or if
     * device does not support the necessary algorithms to support Proof of Key Exchange (PKCE)
     * (this is not expected), or if the user closed the browser before completing the authentication.
     *
     * @param accessId The access point id the user is going to connect to. https://creator.eartho.world
     * @param onSuccess to receive the parsed results
     * @param onFailure to receive the parsed errors
     * @see AuthenticationException.isBrowserAppNotAvailable
     * @see AuthenticationException.isPKCENotAvailable
     * @see AuthenticationException.isAuthenticationCanceled
         */
    public func connectWithPopup(accessId : String, onSuccess: ((Credentials) -> Void)? = nil, onFailure: ((WebAuthError?) -> Void)? = nil){
        let onAuth:((WebAuthResult<Credentials>) -> ())! = {
            switch $0 {
            case .failure(let error):
                print(error.cause ?? "getIdToken unknown error")
                onFailure?(error)
            case .success(let credentials):
                _ = self.credentialsManager.store(credentials: credentials)
                onSuccess?(credentials)
            }
        }
        var earthoOneWebAuth = EarthoOneWebAuth(clientId: clientId, clientSecret: clientSecret, url: .httpsURL(from: defaultDomain), session: .shared)
            .accessId(accessId);
        if(enabledProviders?.isEmpty == false){
            earthoOneWebAuth = earthoOneWebAuth.parameters(["enabled_providers" : enabledProviders!.joined(separator: ", ")]);
        }
        earthoOneWebAuth
            .start(onAuth)
    }
    /**
     * Retrieves the user from the storage without refresh
     **/
    public func getUser() -> UserInfo? {
        return credentialsManager.user;
    }
    /**
    * Retrieves the offline credentials from the storage without refresh
    **/
    public func getIdToken() -> String? {
        return credentialsManager.retrieveCredentials()?.idToken;
    }
    /**
     * Retrieves the credentials from the storage and refresh them if they have already expired.
     * It will fail with [CredentialsManagerException] if the saved access_token or id_token is null,
     * or if the tokens have already expired and the refresh_token is null.
     *
     * @param minTtl   the minimum time in seconds that the access token should last before expiration.
     * @param forceRefresh
     * @param callback the callback that will receive a valid [Credentials] or the [CredentialsManagerException].
     */
    public func getIdToken(onSuccess: ((Credentials) -> Void)? = nil,
                           onFailure: ((CredentialsManagerError?) -> Void)? = nil,
                           minTTL: Int = DEFAULT_MIN_TTL,
                           forceRefresh : Bool=false) {
        let callback:((CredentialsManagerResult<Credentials>) -> ())! = {
            switch $0 {
            case .failure(let error):
                print(error.cause ?? "getIdToken unknown error")
                onFailure?(error)
            case .success(let credentials):
                _ = self.credentialsManager.store(credentials: credentials)
                onSuccess?(credentials)
            }
        }
        credentialsManager.credentials(minTTL:minTTL, callback:callback);
    }
    /**
     * Removes the credentials from the storage if present.
     */
    public func logout() {
        _ = credentialsManager.clear()
    }
}
