import type { CalendarErrorCode } from "./types";

export interface ApiErrorShape {
  statusCode: number;
  error?: string;
  code?: string;
  message: string | string[];
  timestamp?: string;
  path?: string;
}

const CALENDAR_ERROR_MESSAGES: Readonly<Record<CalendarErrorCode, string>> = {
  CALENDAR_AUTHORIZATION_FAILED:
    "Viewing scheduling is temporarily unavailable.",
  CALENDAR_RATE_LIMITED:
    "The calendar service is busy. Please try again shortly.",
  CALENDAR_CONFLICT:
    "The calendar reported a scheduling conflict. Please choose another time.",
  CALENDAR_SLOT_UNAVAILABLE:
    "That viewing time is no longer available. Please choose another slot.",
  CALENDAR_REQUEST_REJECTED:
    "The viewing request could not be accepted. Please refresh and try again.",
  CALENDAR_UPSTREAM_UNAVAILABLE:
    "The calendar service is temporarily unavailable.",
  CALENDAR_INVALID_RESPONSE:
    "The calendar service returned an invalid response. Please try again.",
};

export class ApiError extends Error {
  readonly details: ApiErrorShape;

  constructor(details: ApiErrorShape) {
    super(formatMessage(details.message));
    this.name = "ApiError";
    this.details = details;
  }
}

export function normalizeApiErrorResponse(
  statusCode: number,
  statusText: string,
  body: unknown,
): ApiError {
  const errorBody = isRecord(body) ? body : undefined;
  const fallbackMessage = statusText || "The request failed.";
  const message = readMessage(errorBody?.message, fallbackMessage);
  const details: ApiErrorShape = {
    statusCode,
    message,
  };

  const error = readOptionalString(errorBody?.error);
  const code = readOptionalString(errorBody?.code);
  const timestamp = readOptionalString(errorBody?.timestamp);
  const path = readOptionalString(errorBody?.path);

  if (error) {
    details.error = error;
  }
  if (code) {
    details.code = code;
  }
  if (timestamp) {
    details.timestamp = timestamp;
  }
  if (path) {
    details.path = path;
  }

  return new ApiError(details);
}

export function normalizeNetworkError(error: unknown): ApiError {
  return new ApiError({
    statusCode: 0,
    error: "Network Error",
    message: error instanceof Error ? error.message : "Network request failed.",
  });
}

export function getApiErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Something went wrong. Please try again.";
  }

  if (isCalendarErrorCode(error.details.code)) {
    return CALENDAR_ERROR_MESSAGES[error.details.code];
  }

  if (error.details.statusCode === 0) {
    return "Unable to reach the service. Check your connection and try again.";
  }

  if (error.details.statusCode === 404) {
    return "The requested record could not be found.";
  }

  if (error.details.statusCode === 409) {
    return "The request conflicts with the current state. Refresh and try again.";
  }

  if (error.details.statusCode >= 500) {
    return "The service is temporarily unavailable. Please try again.";
  }

  return formatMessage(error.details.message);
}

function isCalendarErrorCode(
  value: string | undefined,
): value is CalendarErrorCode {
  return (
    value !== undefined &&
    Object.prototype.hasOwnProperty.call(CALENDAR_ERROR_MESSAGES, value)
  );
}

function readMessage(
  value: unknown,
  fallbackMessage: string,
): string | string[] {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    const messages = value.filter(
      (item): item is string => typeof item === "string" && item.trim() !== "",
    );

    if (messages.length > 0) {
      return messages;
    }
  }

  return fallbackMessage;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function formatMessage(message: string | string[]): string {
  return Array.isArray(message) ? message.join(" ") : message;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
