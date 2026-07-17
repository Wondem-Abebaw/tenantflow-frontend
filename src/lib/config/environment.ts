const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

let normalizedApiBaseUrl: URL | undefined;

export function getApiBaseUrl(): URL {
  if (normalizedApiBaseUrl) {
    return new URL(normalizedApiBaseUrl);
  }

  if (!configuredApiBaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is required. Add it to the frontend environment.",
    );
  }

  let apiBaseUrl: URL;

  try {
    apiBaseUrl = new URL(configuredApiBaseUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be a valid absolute URL.");
  }

  if (apiBaseUrl.protocol !== "http:" && apiBaseUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must use HTTP or HTTPS.");
  }

  apiBaseUrl.search = "";
  apiBaseUrl.hash = "";
  apiBaseUrl.pathname = `${apiBaseUrl.pathname.replace(/\/+$/, "")}/`;
  normalizedApiBaseUrl = apiBaseUrl;

  return new URL(normalizedApiBaseUrl);
}
