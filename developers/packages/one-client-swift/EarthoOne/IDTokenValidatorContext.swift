#if WEB_AUTH_PLATFORM
import Foundation

struct IDTokenValidatorContext: IDTokenSignatureValidatorContext, IDTokenClaimsValidatorContext {
    let issuer: String
    let audience: String
    let clientSecret: String
    let leeway: Int
    let maxAge: Int?
    let nonce: String?
}

extension IDTokenValidatorContext {

    init(authentication: Authentication,
         issuer: String,
         leeway: Int,
         maxAge: Int?,
         nonce: String?) {
        self.init(issuer: issuer,
                  audience: authentication.clientId,
                  clientSecret: authentication.clientSecret,
                  leeway: leeway,
                  maxAge: maxAge,
                  nonce: nonce)
    }

}
#endif
