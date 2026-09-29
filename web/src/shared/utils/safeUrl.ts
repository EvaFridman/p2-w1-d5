export function safeUrl(initialUrl: string | null): string | null {
  if (!initialUrl) return null;

  try {
    const url = new URL(initialUrl, "http://localhost");
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getUrl(urlOrPath: string | null): string | null {
  if (!urlOrPath) return null;
  const isAbsolute =
    urlOrPath.toLowerCase().startsWith("http://") || urlOrPath.toLowerCase().startsWith("https://");
  if (isAbsolute) return safeUrl(urlOrPath);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const cleanPath = urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`;

  return safeUrl(`${apiBaseUrl}${cleanPath}`);
}
