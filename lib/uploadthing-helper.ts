export function extractFileKeyFromUrl(
  url: string | undefined | null
): string | null {
  // 如果 URL 为空、未定义或空字符串，直接返回 null。
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
