import * as OTPAuth from 'otpauth';

export const generateSecret = () => {
  const secret = new OTPAuth.Secret();
  return secret.base32;
};

export const generateTOTP = (secret: string) => {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: 'SHA-1',
    digits: 6,
    period: 30,
  });
  return totp.generate();
};

export const verifyTOTP = (secret: string, token: string) => {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: 'SHA-1',
    digits: 6,
    period: 30,
  });
  return totp.validate({ token, window: 1 }) !== null;
};
