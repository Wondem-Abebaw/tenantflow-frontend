import { requestJson, type ApiRequestOptions } from "./request";
import type { PublicPropertyResponse } from "./types";

export function getActiveProperties(
  options: ApiRequestOptions = {},
): Promise<PublicPropertyResponse[]> {
  return requestJson<PublicPropertyResponse[]>(["properties"], options);
}
