import { requestJson, type ApiRequestOptions } from "./request";
import type {
  AvailabilityResponse,
  ScheduleViewingRequest,
  ViewingResponse,
} from "./types";

export function getLeadAvailability(
  leadId: string,
  days?: number,
  options: ApiRequestOptions = {},
): Promise<AvailabilityResponse> {
  const searchParams = new URLSearchParams();

  if (days !== undefined) {
    searchParams.set("days", String(days));
  }

  return requestJson<AvailabilityResponse>(
    ["leads", leadId, "availability"],
    {
      ...options,
      searchParams,
    },
  );
}

export function getLeadViewing(
  leadId: string,
  options: ApiRequestOptions = {},
): Promise<ViewingResponse> {
  return requestJson<ViewingResponse>(["leads", leadId, "viewing"], options);
}

export function scheduleViewing(
  leadId: string,
  request: ScheduleViewingRequest,
  options: ApiRequestOptions = {},
): Promise<ViewingResponse> {
  return requestJson<ViewingResponse>(["leads", leadId, "schedule"], {
    ...options,
    method: "POST",
    body: request,
  });
}
