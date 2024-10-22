
export function toCamelCase(str: string) {
  if (!str) return str
  return str
    .toLowerCase() // Convert the entire string to lowercase
    .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase()); // Remove non-alphanumeric characters and capitalize the following letter
}

export function toTitleCase(str: string) {
  if (!str) return str
  return str
    .toLowerCase() // Convert the entire string to lowercase
    .replace(/\b\w/g, (char: string) => char.toUpperCase()); // Capitalize the first letter of each word
}

export function splitFullName(fullName: string | undefined) {
  if (!fullName) return { firstName: '', lastName: '' };
  const nameParts = fullName.trim().split(' ');

  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' };
  }

  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' '); // Handle middle names

  return { firstName, lastName };
}
