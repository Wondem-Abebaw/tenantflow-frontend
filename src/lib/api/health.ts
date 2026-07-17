import { requestJson, type ApiRequestOptions } from "./request";
import type { HealthResponse } from "./types";

export function checkHealth(
  options: ApiRequestOptions = {},
): Promise<HealthResponse> {
  return requestJson<HealthResponse>(["health"], options);
}
