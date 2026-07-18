import type { AvailabilitySlotResponse } from "@/lib/api/types";

export interface ViewingSlotOption {
  slot: AvailabilitySlotResponse;
  timeLabel: string;
}

export interface ViewingSlotGroup {
  dateKey: string;
  dateLabel: string;
  slots: ViewingSlotOption[];
}

export interface ViewingDateTimeLabel {
  dateLabel: string;
  timeLabel: string;
}

export function groupViewingSlots(
  slots: AvailabilitySlotResponse[],
  timeZone: string,
): ViewingSlotGroup[] | null {
  try {
    const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const dateLabelFormatter = new Intl.DateTimeFormat(undefined, {
      timeZone,
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
    });
    const groups = new Map<string, ViewingSlotGroup>();

    for (const slot of slots) {
      const start = parseInstant(slot.start);
      const end = parseInstant(slot.end);

      if (!start || !end) {
        return null;
      }

      const dateKey = formatDateKey(dateKeyFormatter, start);
      const option: ViewingSlotOption = {
        slot,
        timeLabel: formatTimeRange(timeFormatter, start, end),
      };
      const existingGroup = groups.get(dateKey);

      if (existingGroup) {
        existingGroup.slots.push(option);
      } else {
        groups.set(dateKey, {
          dateKey,
          dateLabel: dateLabelFormatter.format(start),
          slots: [option],
        });
      }
    }

    return Array.from(groups.values());
  } catch {
    return null;
  }
}

export function formatViewingDateTime(
  startValue: string,
  endValue: string,
  timeZone: string,
): ViewingDateTimeLabel | null {
  try {
    const start = parseInstant(startValue);
    const end = parseInstant(endValue);

    if (!start || !end) {
      return null;
    }

    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      timeZone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
    });

    return {
      dateLabel: dateFormatter.format(start),
      timeLabel: formatTimeRange(timeFormatter, start, end),
    };
  } catch {
    return null;
  }
}

function parseInstant(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateKey(formatter: Intl.DateTimeFormat, date: Date): string {
  const parts = formatter.formatToParts(date);
  const year = readDatePart(parts, "year");
  const month = readDatePart(parts, "month");
  const day = readDatePart(parts, "day");

  return `${year}-${month}-${day}`;
}

function readDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: "year" | "month" | "day",
): string {
  const value = parts.find((part) => part.type === type)?.value;

  if (!value) {
    throw new Error(`Unable to format viewing ${type}.`);
  }

  return value;
}

function formatTimeRange(
  formatter: Intl.DateTimeFormat,
  start: Date,
  end: Date,
): string {
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}
