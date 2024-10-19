import {JWTVerifyResult, KeyLike} from "jose";

const jose = require('jose')
import {DecodedIdToken, EarthoOneOptions} from "./global";


export default class EarthoOne {
    public clientId: string;

    public clientSecret: string;

    private issuer = 'https://one.eartho.world/';

    constructor(options: EarthoOneOptions) {
        this.clientId = options.clientId;
        this.clientSecret = options.clientSecret;
    }

    /**
     * Verifies a Eartho ID token (JWT). If the token is valid, the promise is
     * fulfilled with the token's decoded claims; otherwise, the promise is
     * rejected.
     *
     * First verifies whether the corresponding
     * user is disabled. If yes, an `auth/user-disabled` error is thrown. If no,
     * verifies if the session corresponding to the ID token was revoked. If the
     * corresponding user's session was invalidated, an `auth/id-token-revoked`
     * error is thrown. If not specified the check is not applied.
     *
     * @param idToken - The ID token to verify.
     * @returns A promise fulfilled with the
     *   token's decoded claims if the ID token is valid; otherwise, a rejected
     *   promise.
     */
    public async getVerifiedUser(idToken: string): Promise<DecodedIdToken> {
        return jose.importSPKI(this.clientSecret, "RS256", {})
            .then((publicKJwk: KeyLike) => jose.jwtVerify(idToken, publicKJwk, {
                audience: this.clientId,
                issuer: this.issuer,
            })).then(function (x: JWTVerifyResult) {
                return x.payload.user as DecodedIdToken;
            })
    }
}
