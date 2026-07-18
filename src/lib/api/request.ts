import { getApiBaseUrl } from "@/lib/config/environment";

import {
  normalizeApiErrorResponse,
  normalizeNetworkError,
} from "./errors";

export interface ApiRequestOptions {
  signal?: AbortSignal;
  cache?: RequestCache;
}

interface JsonRequestOptions extends ApiRequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  searchParams?: URLSearchParams;
}

export async function requestJson<T>(
  pathSegments: readonly string[],
  options: JsonRequestOptions = {},
): Promise<T> {
  const url = buildApiUrl(pathSegments, options.searchParams);
  const headers = new Headers({
    Accept: "application/json",
  });
  const requestInit: RequestInit = {
    method: options.method ?? "GET",
    headers,
    signal: options.signal,
    cache: options.cache,
  };

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    requestInit.body = JSON.stringify(options.body);
  }

  let response: Response;

  try {
    response = await fetch(url, requestInit);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw normalizeNetworkError(error);
  }

  const body = await parseResponseBody(response);

  if (!response.ok) {
    throw normalizeApiErrorResponse(
      response.status,
      response.statusText,
      body,
    );
  }

  if (body === undefined || typeof body === "string") {
    throw normalizeApiErrorResponse(
      response.status,
      "Invalid JSON response",
      undefined,
    );
  }

  return body as T;
}

function buildApiUrl(
  pathSegments: readonly string[],
  searchParams?: URLSearchParams,
): URL {
  const encodedPath = pathSegments.map(encodeURIComponent).join("/");
  const url = new URL(encodedPath, getApiBaseUrl());

  if (searchParams) {
    url.search = searchParams.toString();
  }

  return url;
}

async function parseResponseBody(
  response: Response,
): Promise<unknown | undefined> {
  const text = await response.text();

  if (!text.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
