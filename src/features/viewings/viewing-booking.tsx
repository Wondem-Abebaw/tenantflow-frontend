"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ApiError, getApiErrorMessage } from "@/lib/api/errors";
import { getLeadState } from "@/lib/api/leads";
import type {
  AvailabilityResponse,
  AvailabilitySlotResponse,
  LeadStatus,
  ViewingResponse,
} from "@/lib/api/types";
import { getLeadAvailability, scheduleViewing } from "@/lib/api/viewings";
import { formatLeadStatus } from "@/lib/formatting/lead-status";
import {
  formatViewingDateTime,
  groupViewingSlots,
} from "@/lib/formatting/viewing";

interface ViewingBookingProps {
  leadId: string;
  initialAvailability: AvailabilityResponse | null;
  initialAvailabilityError: string | null;
  initialStatus: LeadStatus;
  property: {
    address: string;
    unitDetails: string;
  };
}

export function ViewingBooking({
  leadId,
  initialAvailability,
  initialAvailabilityError,
  initialStatus,
  property,
}: ViewingBookingProps) {
  const [leadStatus, setLeadStatus] = useState(initialStatus);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    initialAvailability,
  );
  const [selectedSlot, setSelectedSlot] =
    useState<AvailabilitySlotResponse | null>(null);
  const [confirmedViewing, setConfirmedViewing] =
    useState<ViewingResponse | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    initialAvailabilityError,
  );
  const [schedulingError, setSchedulingError] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(
    null,
  );
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const bookingComplete =
    leadStatus === "SCHEDULED" || confirmedViewing !== null;

  async function loadAvailability(signal?: AbortSignal) {
    try {
      const response = await getLeadAvailability(leadId, undefined, {
        signal,
        cache: "no-store",
      });

      if (signal?.aborted) {
        return;
      }

      setAvailability(response);
      setSelectedSlot((currentSlot) =>
        currentSlot &&
        response.slots.some((slot) => slotsMatch(slot, currentSlot))
          ? currentSlot
          : null,
      );
    } catch (error: unknown) {
      if (isAbortError(error) || signal?.aborted) {
        return;
      }

      if (isForbiddenApiError(error)) {
        try {
          const leadState = await getLeadState(leadId, {
            signal,
            cache: "no-store",
          });

          if (signal?.aborted) {
            return;
          }

          setLeadStatus(leadState.profile.status);

          if (leadState.profile.status === "SCHEDULED") {
            setAvailability(null);
            return;
          }
        } catch (statusError: unknown) {
          if (isAbortError(statusError) || signal?.aborted) {
            return;
          }
        }
      }

      setAvailabilityError(getApiErrorMessage(error));
    } finally {
      if (!signal?.aborted) {
        setIsLoadingAvailability(false);
      }
    }
  }

  async function refreshAvailability() {
    setAvailabilityError(null);
    setIsLoadingAvailability(true);
    await loadAvailability();
  }

  const slotGroups = useMemo(() => {
    if (!availability) {
      return null;
    }

    return groupViewingSlots(availability.slots, availability.timeZone);
  }, [availability]);

  async function handleSchedule() {
    if (
      !selectedSlot ||
      isScheduling ||
      bookingComplete ||
      leadStatus !== "PRE_QUALIFIED"
    ) {
      return;
    }

    setSchedulingError(null);
    setConfirmationNotice(null);
    setIsScheduling(true);

    try {
      const viewing = await scheduleViewing(leadId, {
        start: selectedSlot.start,
        end: selectedSlot.end,
      });

      setConfirmedViewing(viewing);
      setSelectedSlot(null);

      try {
        const leadState = await getLeadState(leadId, { cache: "no-store" });
        setLeadStatus(leadState.profile.status);
      } catch {
        setConfirmationNotice(
          "Your viewing is confirmed, but the latest screening status could not refresh.",
        );
      }
    } catch (error: unknown) {
      setSchedulingError(getApiErrorMessage(error));

      if (isSlotUnavailableError(error)) {
        setSelectedSlot(null);
        await refreshAvailability();
      }
    } finally {
      setIsScheduling(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#f4f5f1] text-[#18201d]">
      <header className="sticky top-0 z-20 border-b border-[#cbd1c9] bg-[#fbfcf9]/95 px-5 py-4 backdrop-blur-sm sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#174c3b]">TenantFlow</p>
            <p className="truncate text-xs text-[#68756f]">Viewing booking</p>
          </div>
          <span className="max-w-44 shrink-0 rounded-[6px] border border-[#6b9d87] bg-[#e8f3ed] px-3 py-1.5 text-center text-xs font-semibold leading-4 text-[#174c3b]">
            {formatLeadStatus(leadStatus)}
          </span>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="border-b border-[#cbd1c9] bg-[#16382f] px-5 py-6 text-white sm:px-8 lg:min-h-[calc(100dvh-69px)] lg:border-r lg:border-b-0 lg:px-7 lg:py-8">
          <p className="text-xs font-semibold text-[#f4c9b8]">Selected home</p>
          <h1 className="mt-3 text-xl font-semibold leading-7 break-words">
            {property.address}
          </h1>
          <p className="mt-3 text-sm leading-6 break-words text-[#cddbd3]">
            {property.unitDetails}
          </p>
          <Link
            className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold text-white underline decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d97a54]"
            href={`/leads/${encodeURIComponent(leadId)}`}
          >
            Back to conversation
          </Link>
        </aside>

        <section className="bg-[#fbfcf9] px-5 py-8 sm:px-8 sm:py-10 lg:min-h-[calc(100dvh-69px)] lg:px-12 lg:py-12">
          <div className="mx-auto w-full max-w-3xl">
            {bookingComplete ? (
              <ViewingConfirmation
                notice={confirmationNotice}
                propertyAddress={property.address}
                timeZone={availability?.timeZone}
                viewing={confirmedViewing}
              />
            ) : leadStatus === "PRE_QUALIFIED" ? (
              <AvailabilitySelection
                availability={availability}
                availabilityError={availabilityError}
                isLoading={isLoadingAvailability}
                isScheduling={isScheduling}
                schedulingError={schedulingError}
                selectedSlot={selectedSlot}
                slotGroups={slotGroups}
                onRefresh={() => {
                  void refreshAvailability();
                }}
                onSchedule={() => {
                  void handleSchedule();
                }}
                onSelectSlot={(slot) => {
                  setSelectedSlot(slot);
                  setSchedulingError(null);
                }}
              />
            ) : (
              <BookingUnavailable leadId={leadId} status={leadStatus} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

interface AvailabilitySelectionProps {
  availability: AvailabilityResponse | null;
  availabilityError: string | null;
  isLoading: boolean;
  isScheduling: boolean;
  schedulingError: string | null;
  selectedSlot: AvailabilitySlotResponse | null;
  slotGroups: ReturnType<typeof groupViewingSlots>;
  onRefresh: () => void;
  onSchedule: () => void;
  onSelectSlot: (slot: AvailabilitySlotResponse) => void;
}

function AvailabilitySelection({
  availability,
  availabilityError,
  isLoading,
  isScheduling,
  schedulingError,
  selectedSlot,
  slotGroups,
  onRefresh,
  onSchedule,
  onSelectSlot,
}: AvailabilitySelectionProps) {
  return (
    <>
      <p className="text-sm font-semibold text-[#b34f32]">Schedule a viewing</p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#102e25] sm:text-4xl">
        Choose an available time
      </h2>

      {isLoading && !availability ? (
        <AvailabilityLoading />
      ) : availabilityError && !availability ? (
        <AvailabilityError message={availabilityError} onRefresh={onRefresh} />
      ) : availability ? (
        <>
          <div className="mt-6 border-y border-[#cbd1c9] py-4">
            <p className="text-sm font-semibold text-[#26332e]">
              Times shown in {availability.timeZone}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#637069]">
              Select one exact time for your property viewing.
            </p>
          </div>

          {slotGroups === null ? (
            <AvailabilityError
              disabled={isLoading}
              message="The available times could not be displayed. Refresh to try again."
              onRefresh={onRefresh}
            />
          ) : slotGroups.length === 0 ? (
            <AvailabilityEmpty disabled={isLoading} onRefresh={onRefresh} />
          ) : (
            <div className="mt-8 space-y-8">
              {slotGroups.map((group) => (
                <fieldset key={group.dateKey}>
                  <legend className="text-base font-semibold text-[#26332e]">
                    {group.dateLabel}
                  </legend>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {group.slots.map(({ slot, timeLabel }) => {
                      const selected =
                        selectedSlot !== null && slotsMatch(slot, selectedSlot);

                      return (
                        <label
                          className={`flex min-h-12 cursor-pointer items-center justify-center rounded-[6px] border px-3 py-2.5 text-center text-sm font-semibold transition-colors focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-[#d97a54] ${
                            selected
                              ? "border-[#174c3b] bg-[#174c3b] text-white"
                              : "border-[#aeb8b2] bg-white text-[#26332e] hover:border-[#2f765e] hover:bg-[#edf7f1]"
                          }`}
                          key={slotKey(slot)}
                        >
                          <input
                            className="sr-only"
                            type="radio"
                            name="viewing-slot"
                            value={slotKey(slot)}
                            checked={selected}
                            disabled={isScheduling}
                            onChange={() => {
                              onSelectSlot(slot);
                            }}
                          />
                          <span>{timeLabel}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          )}

          <div className="mt-8 min-h-16" aria-live="polite">
            {schedulingError ? (
              <div
                className="border-l-4 border-[#b34f32] bg-[#fff1ec] px-4 py-3 text-sm leading-6 text-[#7d301f]"
                role="alert"
              >
                {schedulingError}
              </div>
            ) : availabilityError ? (
              <div
                className="border-l-4 border-[#b88935] bg-[#fff6e7] px-4 py-3 text-sm leading-6 text-[#694718]"
                role="status"
              >
                {availabilityError}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-[#d9ddd7] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              className="min-h-11 self-start text-sm font-semibold text-[#315e4e] underline decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d97a54] disabled:cursor-not-allowed disabled:opacity-60 sm:self-center"
              type="button"
              disabled={isLoading || isScheduling}
              onClick={onRefresh}
            >
              {isLoading ? "Refreshing times" : "Refresh times"}
            </button>
            <button
              className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-[6px] bg-[#174c3b] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#10382b] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d97a54] disabled:cursor-not-allowed disabled:bg-[#9ba6a0] sm:w-auto sm:min-w-48"
              type="button"
              disabled={!selectedSlot || isScheduling || isLoading}
              onClick={onSchedule}
            >
              {isScheduling ? <PendingIndicator /> : null}
              {isScheduling ? "Booking viewing" : "Confirm viewing"}
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}

function AvailabilityLoading() {
  return (
    <div className="mt-8" role="status">
      <p className="text-sm font-semibold text-[#315e4e]">
        Loading available times
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <span
            className="h-12 animate-pulse rounded-[6px] bg-[#e2e7e2]"
            key={index}
          />
        ))}
      </div>
    </div>
  );
}

function AvailabilityError({
  disabled = false,
  message,
  onRefresh,
}: {
  disabled?: boolean;
  message: string;
  onRefresh: () => void;
}) {
  return (
    <div className="mt-8 border-l-4 border-[#b34f32] bg-[#fff1ec] px-4 py-4">
      <p className="text-sm leading-6 text-[#7d301f]" role="alert">
        {message}
      </p>
      <button
        className="mt-3 min-h-10 text-sm font-semibold text-[#7d301f] underline decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d97a54]"
        type="button"
        disabled={disabled}
        onClick={onRefresh}
      >
        {disabled ? "Refreshing times" : "Try again"}
      </button>
    </div>
  );
}

function AvailabilityEmpty({
  disabled,
  onRefresh,
}: {
  disabled: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="mt-8 border border-[#cbd1c9] bg-[#f4f6f3] px-4 py-5">
      <p className="text-sm font-semibold text-[#26332e]">
        No viewing times are currently available
      </p>
      <p className="mt-1 text-sm leading-6 text-[#637069]">
        Availability can change, so you can check again.
      </p>
      <button
        className="mt-3 min-h-10 text-sm font-semibold text-[#315e4e] underline decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d97a54]"
        type="button"
        disabled={disabled}
        onClick={onRefresh}
      >
        {disabled ? "Refreshing times" : "Refresh times"}
      </button>
    </div>
  );
}

function ViewingConfirmation({
  notice,
  propertyAddress,
  timeZone,
  viewing,
}: {
  notice: string | null;
  propertyAddress: string;
  timeZone: string | undefined;
  viewing: ViewingResponse | null;
}) {
  const dateTime =
    viewing && timeZone
      ? formatViewingDateTime(viewing.scheduledAt, viewing.endsAt, timeZone)
      : null;
  const calendarLink = getSafeCalendarLink(viewing?.calendarEventLink);

  return (
    <section
      aria-labelledby="viewing-confirmation-title"
      className="border-t-4 border-[#2f765e] bg-[#edf7f1] px-5 py-6 sm:px-7 sm:py-7"
    >
      <p className="text-sm font-semibold text-[#24604c]">Viewing confirmed</p>
      <h2
        className="mt-3 text-3xl font-semibold leading-tight text-[#123d30]"
        id="viewing-confirmation-title"
      >
        Your appointment is scheduled
      </h2>

      <dl className="mt-6 grid gap-5 border-y border-[#b8d4c7] py-5 sm:grid-cols-2">
        {dateTime ? (
          <>
            <ConfirmationDetail label="Date" value={dateTime.dateLabel} />
            <ConfirmationDetail
              label={`Time (${timeZone})`}
              value={dateTime.timeLabel}
            />
          </>
        ) : null}
        <ConfirmationDetail
          className={dateTime ? "sm:col-span-2" : ""}
          label="Property"
          value={propertyAddress}
        />
      </dl>

      {!viewing ? (
        <p className="mt-5 text-sm leading-6 text-[#49645a]">
          This lead already has a scheduled viewing. Additional booking attempts
          are disabled.
        </p>
      ) : null}

      {notice ? (
        <p
          className="mt-5 border-l-4 border-[#b88935] bg-[#fff6e7] px-4 py-3 text-sm leading-6 text-[#694718]"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      {calendarLink ? (
        <a
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-[6px] bg-[#174c3b] px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#10382b] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d97a54] sm:w-auto"
          href={calendarLink}
          target="_blank"
          rel="noreferrer"
        >
          Open calendar event
        </a>
      ) : null}
    </section>
  );
}

function ConfirmationDetail({
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
      <dt className="text-xs font-semibold text-[#527064]">{label}</dt>
      <dd className="mt-1 text-base leading-6 break-words text-[#183f32]">
        {value}
      </dd>
    </div>
  );
}

function BookingUnavailable({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  return (
    <section className="border-t-4 border-[#b88935] bg-[#fff6e7] px-5 py-6 sm:px-7 sm:py-7">
      <p className="text-sm font-semibold text-[#694718]">
        Viewing booking unavailable
      </p>
      <h2 className="mt-3 text-2xl font-semibold leading-8 text-[#49310f]">
        This screening is not ready for scheduling
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#6f5229]">
        The current status is {formatLeadStatus(status).toLowerCase()}.
      </p>
      <Link
        className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[#694718] underline decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d97a54]"
        href={`/leads/${encodeURIComponent(leadId)}`}
      >
        Return to screening
      </Link>
    </section>
  );
}

function PendingIndicator() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"
    />
  );
}

function slotsMatch(
  first: AvailabilitySlotResponse,
  second: AvailabilitySlotResponse,
): boolean {
  return first.start === second.start && first.end === second.end;
}

function slotKey(slot: AvailabilitySlotResponse): string {
  return `${slot.start}|${slot.end}`;
}

function isSlotUnavailableError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.details.code === "CALENDAR_SLOT_UNAVAILABLE"
  );
}

function isForbiddenApiError(error: unknown): boolean {
  return error instanceof ApiError && error.details.statusCode === 403;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function getSafeCalendarLink(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
