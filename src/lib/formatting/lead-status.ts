import type { LeadStatus } from "@/lib/api/types";

const LEAD_STATUS_LABELS: Readonly<Record<LeadStatus, string>> = {
  INQUIRY: "Inquiry received",
  CHATTING: "Screening in progress",
  PRE_QUALIFIED: "Screening complete",
  REJECTED: "Screening complete",
  SCHEDULED: "Viewing scheduled",
  COMPLETED: "Completed",
};

export function formatLeadStatus(status: LeadStatus): string {
  return LEAD_STATUS_LABELS[status];
}
