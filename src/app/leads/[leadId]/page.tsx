import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ScreeningChat } from "@/features/conversation/screening-chat";
import { toScreeningChatState } from "@/features/conversation/screening-chat-state";
import { ApiError } from "@/lib/api/errors";
import { getLeadState } from "@/lib/api/leads";
import type { LeadStateResponse } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Screening conversation",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

interface LeadPageProps {
  params: Promise<{
    leadId: string;
  }>;
}

export default async function LeadPage({ params }: LeadPageProps) {
  const { leadId } = await params;
  const leadState = await loadLeadState(leadId);

  return (
    <ScreeningChat
      leadId={leadId}
      initialState={toScreeningChatState(leadState)}
    />
  );
}

async function loadLeadState(leadId: string): Promise<LeadStateResponse> {
  try {
    return await getLeadState(leadId, { cache: "no-store" });
  } catch (error: unknown) {
    if (
      error instanceof ApiError &&
      (error.details.statusCode === 400 || error.details.statusCode === 404)
    ) {
      notFound();
    }

    throw error;
  }
}
