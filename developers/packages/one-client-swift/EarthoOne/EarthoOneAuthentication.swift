import Foundation

struct EarthoOneAuthentication: Authentication {

    let clientId: String
    let clientSecret: String
    let url: URL
    var telemetry: Telemetry
    var logger: Logger?

    let session: URLSession

    init(clientId: String, clientSecret: String, url: URL, session: URLSession = URLSession.shared, telemetry: Telemetry = Telemetry()) {
        self.clientId = clientId
        self.clientSecret = clientSecret
        self.url = url
        self.session = session
        self.telemetry = telemetry
    }

    func userInfo(withAccessToken accessToken: String) -> Request<UserInfo, AuthenticationError> {
        let userInfo = URL(string: "userinfo", relativeTo: self.url)!
        return Request(session: session,
                       url: userInfo,
                       method: "GET",
                       handle: authenticationObject,
                       headers: ["Authorization": "Bearer \(accessToken)"],
                       logger: self.logger,
                       telemetry: self.telemetry)
    }

    func codeExchange(withCode code: String, codeVerifier: String, redirectURI: String, accessId: String) -> Request<Credentials, AuthenticationError> {
        return self.token().parameters([
            "code": code,
            "code_verifier": codeVerifier,
            "redirect_uri": redirectURI,
            "access_id": accessId,
            "grant_type": "authorization_code"
        ])
    }

    func renew(withRefreshToken refreshToken: String, scope: String? = nil) -> Request<Credentials, AuthenticationError> {
        var payload: [String: Any] = [
            "refresh_token": refreshToken,
            "grant_type": "refresh_token",
            "client_id": self.clientId
        ]
        payload["scope"] = scope
        let oauthToken = URL(string: "access/oauth/refreshtoken", relativeTo: self.url)!
        return Request(session: session,
                       url: oauthToken,
                       method: "POST",
                       handle: codable,
                       parameters: payload, // Initializer does not enforce 'openid' scope
                       logger: self.logger,
                       telemetry: self.telemetry)
    }

    func revoke(refreshToken: String) -> Request<Void, AuthenticationError> {
        let payload: [String: Any] = [
            "token": refreshToken,
            "client_id": self.clientId
        ]
        let oauthToken = URL(string: "access/oauth/revoke", relativeTo: self.url)!
        return Request(session: session,
                       url: oauthToken,
                       method: "POST",
                       handle: noBody,
                       parameters: payload,
                       logger: self.logger,
                       telemetry: self.telemetry)
    }

}

// MARK: - Private Methods

private extension EarthoOneAuthentication {

    func login(username: String, otp: String, realm: String, audience: String?, scope: String) -> Request<Credentials, AuthenticationError> {
        let url = URL(string: "access/oauth/token", relativeTo: self.url)!
        var payload: [String: Any] = [
            "username": username,
            "otp": otp,
            "realm": realm,
            "grant_type": "http://eartho.com/oauth/grant-type/passwordless/otp",
            "client_id": self.clientId
        ]
        payload["audience"] = audience
        payload["scope"] = includeRequiredScope(in: scope)
        return Request(session: session,
                       url: url,
                       method: "POST",
                       handle: codable,
                       parameters: payload,
                       logger: self.logger,
                       telemetry: self.telemetry)
    }

    func token() -> Request<Credentials, AuthenticationError> {
        let payload: [String: Any] = [
            "client_id": self.clientId
        ]
        let token = URL(string: "access/oauth/token", relativeTo: self.url)!
        return Request(session: session,
                       url: token,
                       method: "POST",
                       handle: codable,
                       parameters: payload,
                       logger: self.logger,
                       telemetry: self.telemetry)
    }

    func tokenExchange(subjectToken: String, subjectTokenType: String, scope: String, audience: String?, parameters: [String: Any] = [:]) -> Request<Credentials, AuthenticationError> {
        var parameters: [String: Any] = parameters
        parameters["grant_type"] = "urn:ietf:params:oauth:grant-type:token-exchange"
        parameters["subject_token"] = subjectToken
        parameters["subject_token_type"] = subjectTokenType
        parameters["audience"] = audience
        parameters["scope"] = scope
        return self.token().parameters(parameters) // parameters() enforces 'openid' scope
    }

}
