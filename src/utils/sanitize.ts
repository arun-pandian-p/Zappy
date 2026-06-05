/**
 * Shared utility to sanitize user-supplied string inputs before database operations.
 * Strips HTML tags and trims leading/trailing whitespace to prevent XSS/injection.
 */
export function sanitize(input: string | null | undefined): string {
  if (!input) return "";
  
  // Strip HTML tags using regex
  const clean = input.replace(/<\/?[^>]+(>|$)/g, "");
  
  // Trim leading/trailing whitespace
  return clean.trim();
}
