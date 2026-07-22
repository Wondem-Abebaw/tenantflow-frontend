import { queryOptions } from "@tanstack/react-query";

import { getLeadState } from "./leads";
import { getActiveProperties } from "./properties";
import { getLeadAvailability, getLeadViewing } from "./viewings";

export const apiQueryKeys = {
  activeProperties: ["properties", "active"] as const,
  leadState: (leadId: string) => ["leads", leadId, "state"] as const,
  leadAvailability: (leadId: string, days?: number) =>
    ["leads", leadId, "availability", days ?? "default"] as const,
  leadViewing: (leadId: string) => ["leads", leadId, "viewing"] as const,
};

export function activePropertiesQueryOptions() {
  return queryOptions({
    queryKey: apiQueryKeys.activeProperties,
    queryFn: ({ signal }) => getActiveProperties({ signal, cache: "no-store" }),
    staleTime: 60_000,
  });
}

export function leadStateQueryOptions(leadId: string) {
  return queryOptions({
    queryKey: apiQueryKeys.leadState(leadId),
    queryFn: ({ signal }) =>
      getLeadState(leadId, { signal, cache: "no-store" }),
    staleTime: 5_000,
  });
}

export function leadAvailabilityQueryOptions(leadId: string, days?: number) {
  return queryOptions({
    queryKey: apiQueryKeys.leadAvailability(leadId, days),
    queryFn: ({ signal }) =>
      getLeadAvailability(leadId, days, {
        signal,
        cache: "no-store",
      }),
    staleTime: 0,
  });
}

export function leadViewingQueryOptions(leadId: string) {
  return queryOptions({
    queryKey: apiQueryKeys.leadViewing(leadId),
    queryFn: ({ signal }) =>
      getLeadViewing(leadId, { signal, cache: "no-store" }),
    staleTime: 30_000,
  });
}
