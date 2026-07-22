import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ScreeningChat } from "@/features/conversation/screening-chat";
import { ApiError } from "@/lib/api/errors";
import { leadStateQueryOptions } from "@/lib/api/query-options";

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
  const queryClient = new QueryClient();
  await loadLeadState(queryClient, leadId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ScreeningChat leadId={leadId} />
    </HydrationBoundary>
  );
}

async function loadLeadState(
  queryClient: QueryClient,
  leadId: string,
): Promise<void> {
  try {
    await queryClient.fetchQuery(leadStateQueryOptions(leadId));
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
