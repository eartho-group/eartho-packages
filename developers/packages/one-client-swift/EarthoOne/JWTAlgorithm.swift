#if WEB_AUTH_PLATFORM
import Foundation
import JWTDecode

enum JWTAlgorithm: String {
    case rs256 = "RS256"

    func verify(_ jwt: JWT, using jwk: String) -> Bool {
        
        let parts = jwt.string.components(separatedBy: ".")
        let header = parts[0]
        let payload = parts[1]
        let signature = parts[2]
        
        let publicKeyText = jwk.replacingOccurrences(of: "\n", with: "")
            .replacingOccurrences(of: "-----BEGIN PUBLIC KEY-----", with: "")
            .replacingOccurrences(of: "-----END PUBLIC KEY-----", with: "")
            .replacingOccurrences(of: " ", with: "")
        
        let dataPublicKey = Data(base64Encoded: publicKeyText)!
        let publicKey: SecKey! = SecKeyCreateWithData(dataPublicKey as NSData, [
            kSecAttrKeyType: kSecAttrKeyTypeRSA,
            kSecAttrKeyClass: kSecAttrKeyClassPublic
        ] as NSDictionary, nil)

        
        let dataSigned = (header + "." + payload).data(using: .ascii)!

        // Create signature data
        let dataSignature = Data.init(
            base64Encoded: base64StringWithPadding(encodedString: signature)
        )!

        let algorithm: SecKeyAlgorithm = .rsaSignatureMessagePKCS1v15SHA256

        let result = SecKeyVerifySignature(publicKey,
                                           algorithm,
                                           dataSigned as NSData,
                                           dataSignature as NSData,
                                           nil)
        
        return result
    }
    
    func base64StringWithPadding(encodedString: String) -> String {
        var stringTobeEncoded = encodedString.replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        let paddingCount = encodedString.count % 4
        for _ in 0..<paddingCount {
            stringTobeEncoded += "="
        }
        return stringTobeEncoded
    }

    func decodeJWTPart(payload: String) -> [String: Any]? {
        let payloadPaddingString = base64StringWithPadding(encodedString: payload)
        guard let payloadData = Data(base64Encoded: payloadPaddingString) else {
            fatalError("payload could not converted to data")
        }
            return try? JSONSerialization.jsonObject(
            with: payloadData,
            options: []) as? [String: Any]
    }
}
#endif
