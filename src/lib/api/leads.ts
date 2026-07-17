import { requestJson, type ApiRequestOptions } from "./request";
import type {
  AddLeadMessageRequest,
  AddLeadMessageResponse,
  CreateLeadRequest,
  CreateLeadResponse,
  LeadStateResponse,
} from "./types";

export function createLead(
  request: CreateLeadRequest,
  options: ApiRequestOptions = {},
): Promise<CreateLeadResponse> {
  return requestJson<CreateLeadResponse>(["leads"], {
    ...options,
    method: "POST",
    body: request,
  });
}

export function addLeadMessage(
  leadId: string,
  request: AddLeadMessageRequest,
  options: ApiRequestOptions = {},
): Promise<AddLeadMessageResponse> {
  return requestJson<AddLeadMessageResponse>(
    ["leads", leadId, "messages"],
    {
      ...options,
      method: "POST",
      body: request,
    },
  );
}

export function getLeadState(
  leadId: string,
  options: ApiRequestOptions = {},
): Promise<LeadStateResponse> {
  return requestJson<LeadStateResponse>(["leads", leadId], options);
}
