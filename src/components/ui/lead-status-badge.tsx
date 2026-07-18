import type { LeadStatus } from "@/lib/api/types";
import { formatLeadStatus } from "@/lib/formatting/lead-status";

const STATUS_STYLES: Readonly<Record<LeadStatus, string>> = {
  INQUIRY: "border-[#d7a45b] bg-[#fff4df] text-[#784b17]",
  CHATTING: "border-[#6b9d87] bg-[#e8f3ed] text-[#174c3b]",
  PRE_QUALIFIED: "border-[#6b9d87] bg-[#e8f3ed] text-[#174c3b]",
  REJECTED: "border-[#b8aaa4] bg-[#f2efed] text-[#5d514c]",
  SCHEDULED: "border-[#7890a0] bg-[#ebf1f4] text-[#344f60]",
  COMPLETED: "border-[#a7afaa] bg-[#f0f2f0] text-[#4f5a55]",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`min-w-0 max-w-44 shrink rounded-[6px] border px-3 py-1.5 text-center text-xs font-semibold leading-4 break-words ${STATUS_STYLES[status]}`}
    >
      {formatLeadStatus(status)}
    </span>
  );
}
