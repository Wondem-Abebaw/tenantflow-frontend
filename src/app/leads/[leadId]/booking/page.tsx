import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ViewingBooking } from "@/features/viewings/viewing-booking";
import { ApiError, getApiErrorMessage } from "@/lib/api/errors";
import { getLeadState } from "@/lib/api/leads";
import type {
  AvailabilityResponse,
  LeadStateResponse,
  LeadStatus,
} from "@/lib/api/types";
import { getLeadAvailability } from "@/lib/api/viewings";

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
  const leadState = await loadLeadState(leadId);
  const initialAvailability = await loadInitialAvailability(
    leadId,
    leadState.profile.status,
  );

  return (
    <ViewingBooking
      leadId={leadId}
      initialAvailability={initialAvailability.data}
      initialAvailabilityError={initialAvailability.error}
      initialStatus={leadState.profile.status}
      property={{
        address: leadState.property.address,
        unitDetails: leadState.property.unitDetails,
      }}
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

interface InitialAvailabilityResult {
  data: AvailabilityResponse | null;
  error: string | null;
}

async function loadInitialAvailability(
  leadId: string,
  status: LeadStatus,
): Promise<InitialAvailabilityResult> {
  if (status !== "PRE_QUALIFIED") {
    return { data: null, error: null };
  }

  try {
    return {
      data: await getLeadAvailability(leadId, undefined, { cache: "no-store" }),
      error: null,
    };
  } catch (error: unknown) {
    return {
      data: null,
      error: getApiErrorMessage(error),
    };
  }
}
