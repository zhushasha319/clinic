export function extractFileKeyFromUrl(
  url: string | undefined | null
): string | null {
  // Return null immediately if the URL is null, undefined, or an empty string.
  if (!url) {
    return null;
  }
  const parts = url.split("/f/");
 
  if (parts.length === 2 && parts[1]) {
    const fileKey = parts[1].split("?")[0].split("#")[0];
    return fileKey;
  }
  return null;
}