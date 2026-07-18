const APP_LOCALE = "en-US";

const dateOnlyFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const localDateTimeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateOnly(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return "Date unavailable";
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "Date unavailable";
  }

  return dateOnlyFormatter.format(date);
}

export function formatDateTime(
  value: string,
  timeZone?: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  if (!timeZone) {
    return localDateTimeFormatter.format(date);
  }

  try {
    return new Intl.DateTimeFormat(APP_LOCALE, {
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return "Time unavailable";
  }
}
