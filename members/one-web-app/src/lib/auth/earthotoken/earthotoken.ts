import jwt from "jsonwebtoken";
import { Account, User } from "next-auth";

export async function getEarthoToken(user: User, account: Account, timeToLiveSec: number) {
    if (!account || !user) return null; // Ensure a token is returned

    // Define your company's JWT payload and secret
    // console.log(user)
    // console.log(account)

    const payload = {
        iss: "https://one.eartho.world/",
        aud: "eartho",
        auth_time: Math.floor(Date.now() / 1000), // Current time
        sub: user.id, // Actual subject
        iat: Math.floor(Date.now() / 1000), // Issued at time
        exp: Math.floor(Date.now() / 1000) + timeToLiveSec, // Expiry time (1 hour from now),
        user: user,
        eartho: {
            identities: {
                [account.provider]: [
                    account.providerAccountId
                ]
            },
            sign_in_provider: account.provider
        }
    };
    // Create a new JWT token
    const token = jwt.sign(payload, process.env.EARTHO_SIGNIN_KEY_PRIVATE!, { algorithm: 'RS256' });

    return token;
}