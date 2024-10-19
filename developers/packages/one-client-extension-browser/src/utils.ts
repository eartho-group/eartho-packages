/**
 * Returns an empty string when value is falsy, or when it's value is included in the exclude argument.
 * @param value The value to check
 * @param exclude An array of values that should result in an empty string.
 * @returns The value, or an empty string when falsy or included in the exclude argument.
 */
export function valueOrEmptyString(value: string, exclude: string[] = []) {
  return value && !exclude.includes(value) ? value : '';
}
