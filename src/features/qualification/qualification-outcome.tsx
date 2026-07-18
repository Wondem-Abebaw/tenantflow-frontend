import Link from "next/link";

import type {
  LeadStatus,
  PropertyResponse,
  QualificationDecisionResponse,
} from "@/lib/api/types";
import { formatDateOnly } from "@/lib/formatting/date";
import {
  formatBedrooms,
  formatMonthlyRent,
  formatPetPolicy,
} from "@/lib/formatting/property";

interface QualificationOutcomeProps {
  leadId: string;
  status: LeadStatus;
  qualification: QualificationDecisionResponse | null;
}

export function QualificationOutcome({
  leadId,
  status,
  qualification,
}: QualificationOutcomeProps) {
  if (status === "PRE_QUALIFIED") {
    return <PreQualifiedOutcome leadId={leadId} />;
  }

  if (status === "SCHEDULED") {
    return <ScheduledOutcome leadId={leadId} />;
  }

  if (status !== "REJECTED") {
    return null;
  }

  const failedReasons = qualification?.failedReasons ?? [];
  const alternativeProperties = qualification?.alternativeProperties ?? [];

  return (
    <section
      aria-labelledby="qualification-outcome-title"
      className="border-t-4 border-[#b85d3d] bg-[#fff8f4] px-5 py-6 sm:px-7 sm:py-7"
    >
      <p className="text-xs font-semibold text-[#8b3c26]">Screening result</p>
      <h2
        className="mt-2 text-xl font-semibold leading-7 text-[#3c241c]"
        id="qualification-outcome-title"
      >
        This home was not the right match
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#665650]">
        We could not pre-qualify the application for the selected home. The
        screening result was based on the information provided.
      </p>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-[#3c241c]">
          What affected the result
        </h3>
        {failedReasons.length > 0 ? (
          <ul className="mt-3 space-y-2" aria-label="Screening result details">
            {failedReasons.map((reason, index) => (
              <li
                className="border-l-2 border-[#d89b86] pl-3 text-sm leading-6 text-[#5e4b44]"
                key={`${reason}-${index}`}
              >
                {reason}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-6 text-[#665650]">
            No additional result details were returned.
          </p>
        )}
      </div>

      <div className="mt-8 border-t border-[#e4cfc6] pt-6">
        <h3 className="text-lg font-semibold text-[#3c241c]">
          Other available homes
        </h3>
        {alternativeProperties.length > 0 ? (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {alternativeProperties.map((property) => (
              <li key={property.id}>
                <AlternativePropertyCard property={property} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 border border-[#d9c8c0] bg-white px-4 py-4">
            <p className="text-sm font-semibold text-[#493831]">
              No alternative homes are available right now
            </p>
            <p className="mt-1 text-sm leading-6 text-[#6d5d56]">
              There are no matching properties to show at this time.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function PreQualifiedOutcome({ leadId }: { leadId: string }) {
  return (
    <section
      aria-labelledby="qualification-outcome-title"
      className="border-t-4 border-[#2f765e] bg-[#edf7f1] px-5 py-6 sm:px-7 sm:py-7"
    >
      <p className="text-xs font-semibold text-[#24604c]">Pre-qualified</p>
      <h2
        className="mt-2 text-xl font-semibold leading-7 text-[#123d30]"
        id="qualification-outcome-title"
      >
        You can move on to viewing availability
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#49645a]">
        Your screening is complete. Continue to choose an available time to
        view the property.
      </p>
      <Link
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-[6px] bg-[#174c3b] px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#10382b] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d97a54] sm:w-auto"
        href={`/leads/${encodeURIComponent(leadId)}/booking`}
      >
        View available times
      </Link>
    </section>
  );
}

function ScheduledOutcome({ leadId }: { leadId: string }) {
  return (
    <section
      aria-labelledby="qualification-outcome-title"
      className="border-t-4 border-[#58798b] bg-[#eef4f7] px-5 py-6 sm:px-7 sm:py-7"
    >
      <p className="text-xs font-semibold text-[#344f60]">Viewing scheduled</p>
      <h2
        className="mt-2 text-xl font-semibold leading-7 break-words text-[#233f50]"
        id="qualification-outcome-title"
      >
        Your appointment is confirmed
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#526976]">
        Booking is complete, and additional scheduling attempts are disabled.
      </p>
      <Link
        className="mt-6 inline-flex min-h-12 w-full max-w-full items-center justify-center rounded-[6px] bg-[#344f60] px-6 py-3 text-center text-sm font-semibold break-words text-white transition-colors hover:bg-[#293f4d] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d97a54] sm:w-auto"
        href={`/leads/${encodeURIComponent(leadId)}/booking`}
      >
        View booking confirmation
      </Link>
    </section>
  );
}

function AlternativePropertyCard({
  property,
}: {
  property: PropertyResponse;
}) {
  return (
    <article className="h-full rounded-[8px] border border-[#d9c8c0] bg-white p-4">
      <h4 className="text-base font-semibold leading-6 break-words text-[#34251f]">
        {property.address}
      </h4>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <PropertyDetail
          label="Rent"
          value={formatMonthlyRent(property.monthlyRent)}
        />
        <PropertyDetail
          label="Bedrooms"
          value={formatBedrooms(property.bedrooms)}
        />
        <PropertyDetail
          className="col-span-2"
          label="Available"
          value={formatDateOnly(property.availableFrom)}
        />
        <PropertyDetail
          className="col-span-2"
          label="Pet policy"
          value={formatPetPolicy(property.petPolicy)}
        />
      </dl>
    </article>
  );
}

function PropertyDetail({
  className = "",
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold text-[#806d64]">{label}</dt>
      <dd className="mt-1 leading-5 break-words text-[#45352e]">{value}</dd>
    </div>
  );
}
