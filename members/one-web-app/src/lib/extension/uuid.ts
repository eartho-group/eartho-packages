import crypto from 'crypto';

export const uuid = () => `${Date.now()}-${Math.random().toString(36)}-${Date.now().toString(36)}`;

export const uuidOfString = function (input: string) {
  return crypto.createHash('sha1').update(JSON.stringify(input)).digest('hex');
};
export const sha256OfString = function (input: string) {
  return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
};
export default { uuid };
