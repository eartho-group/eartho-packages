export interface EarthoOneOptions {
    clientId: string;
    clientSecret: string;
}

export interface DecodedIdToken {
    /**
     * The `uid` corresponding to the user who the ID token belonged to.
     *
     * This value is not actually in the JWT token claims itself. It is added as a
     * convenience, and is set as the value of the [`sub`](#sub) property.
     */
    uid: string;
    /**
     * The optional display name for an enrolled second factor.
     */
    displayName?: string;
    /**
     * The email of the user to whom the ID token belongs, if available.
     */
    email?: string;
    /**
     * The photo URL for the user to whom the ID token belongs, if available.
     */
    picture?: string;
    /**
     * The phone number of the user to whom the ID token belongs, if available.
     */
    phone_number?: string;
    /**
     * Whether or not the email of the user to whom the ID token belongs is
     * verified, provided the user has an email.
     */
    email_verified?: boolean;

    /**
     * Other arbitrary claims included in the ID token.
     */
    [key: string]: any;
}