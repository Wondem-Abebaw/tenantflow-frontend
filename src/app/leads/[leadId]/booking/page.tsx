import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ViewingBooking } from "@/features/viewings/viewing-booking";
import { ApiError } from "@/lib/api/errors";
import {
  leadAvailabilityQueryOptions,
  leadStateQueryOptions,
  leadViewingQueryOptions,
} from "@/lib/api/query-options";
import type { LeadStateResponse } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Book a viewing",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

interface BookingPageProps {
  params: Promise<{
    leadId: string;
  }>;
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { leadId } = await params;
  const queryClient = new QueryClient();
  const leadState = await loadLeadState(queryClient, leadId);
  const preloadRequests: Promise<void>[] = [];

  if (leadState.profile.status === "PRE_QUALIFIED") {
    preloadRequests.push(
      queryClient.prefetchQuery(leadAvailabilityQueryOptions(leadId)),
    );
  }

  if (
    leadState.profile.status === "SCHEDULED" ||
    leadState.profile.status === "COMPLETED"
  ) {
    preloadRequests.push(
      queryClient.prefetchQuery(leadViewingQueryOptions(leadId)),
    );
  }

  await Promise.all(preloadRequests);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ViewingBooking leadId={leadId} />
    </HydrationBoundary>
  );
}

async function loadLeadState(
  queryClient: QueryClient,
  leadId: string,
): Promise<LeadStateResponse> {
  try {
    return await queryClient.fetchQuery(leadStateQueryOptions(leadId));
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
