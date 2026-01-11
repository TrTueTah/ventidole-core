/**
 * Convert String to Boolean
 *
 * Helper function to convert string values to boolean.
 */
export function convertStringToBool(value: string | boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  const lowercased = value.toLowerCase().trim();
  return lowercased === 'true' || lowercased === '1' || lowercased === 'yes';
}
