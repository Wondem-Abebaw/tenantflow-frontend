"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { createLead } from "@/lib/api/leads";
import { activePropertiesQueryOptions } from "@/lib/api/query-options";
import type {
  CreateLeadRequest,
  PublicPropertyResponse,
} from "@/lib/api/types";
import { formatDateOnly } from "@/lib/formatting/date";
import {
  formatBedrooms,
  formatMonthlyRent,
  formatPetPolicy,
} from "@/lib/formatting/property";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INQUIRY_FIELDS = [
  "name",
  "email",
  "phone",
  "message",
  "propertyId",
] as const satisfies readonly (keyof CreateLeadRequest)[];

type InquiryField = (typeof INQUIRY_FIELDS)[number];
type FieldErrors = Partial<Record<InquiryField, string>>;
type PropertyLoadState = "loading" | "ready" | "error";

interface InquiryFormProps {
  propertyId: string;
}

export function InquiryForm({ propertyId }: InquiryFormProps) {
  const router = useRouter();
  const linkedPropertyId = UUID_PATTERN.test(propertyId) ? propertyId : "";
  const propertiesQuery = useQuery(activePropertiesQueryOptions());
  const createLeadMutation = useMutation({
    mutationFn: (request: CreateLeadRequest) => createLead(request),
    onSuccess: (response) => {
      router.push(`/leads/${encodeURIComponent(response.leadId)}`);
    },
  });
  const properties = propertiesQuery.data ?? [];
  const [selectedPropertyId, setSelectedPropertyId] =
    useState(linkedPropertyId);
  const [propertyNotice, setPropertyNotice] = useState<string | null>(
    propertyId && !linkedPropertyId
      ? "The linked property is invalid. Choose an available home below."
      : null,
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const linkedPropertyUnavailable = Boolean(
    linkedPropertyId &&
    propertiesQuery.data &&
    !propertiesQuery.data.some((property) => property.id === linkedPropertyId),
  );
  const selectedPropertyIdForRequest =
    linkedPropertyUnavailable && selectedPropertyId === linkedPropertyId
      ? ""
      : selectedPropertyId;
  const displayedPropertyNotice =
    linkedPropertyUnavailable && selectedPropertyId === linkedPropertyId
      ? "The linked property is no longer available. Choose another home."
      : propertyNotice;
  const propertyLoadState: PropertyLoadState =
    propertiesQuery.data === undefined && propertiesQuery.isFetching
      ? "loading"
      : propertiesQuery.data === undefined && propertiesQuery.isError
        ? "error"
        : "ready";
  const propertyLoadError = propertiesQuery.error
    ? getApiErrorMessage(propertiesQuery.error)
    : null;
  const requestError = createLeadMutation.error
    ? getApiErrorMessage(createLeadMutation.error)
    : null;
  const isPending = createLeadMutation.isPending;
  const selectedProperty = properties.find(
    (property) => property.id === selectedPropertyIdForRequest,
  );
  const hasValidProperty =
    propertyLoadState === "ready" && Boolean(selectedProperty);

  useEffect(() => {
    if (linkedPropertyUnavailable && selectedPropertyId === linkedPropertyId) {
      replacePropertySearchParam("");
    }
  }, [linkedPropertyId, linkedPropertyUnavailable, selectedPropertyId]);

  function handlePropertyChange(event: ChangeEvent<HTMLInputElement>) {
    const nextPropertyId = event.currentTarget.value;
    setSelectedPropertyId(nextPropertyId);
    setPropertyNotice(null);
    createLeadMutation.reset();
    setFieldErrors((currentErrors) => {
      if (!currentErrors.propertyId) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors.propertyId;
      return nextErrors;
    });
    replacePropertySearchParam(nextPropertyId);
  }

  function retryPropertyLoad() {
    void propertiesQuery.refetch();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const form = event.currentTarget;
    const request = readRequest(
      new FormData(form),
      selectedPropertyIdForRequest,
    );
    const errors = validateRequest(request);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      focusFirstInvalidField(form, errors);
      return;
    }

    setFieldErrors({});
    createLeadMutation.reset();
    createLeadMutation.mutate(request);
  }

  function handleFieldChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target;

    if (
      !(target instanceof HTMLInputElement) &&
      !(target instanceof HTMLTextAreaElement)
    ) {
      return;
    }

    const fieldName = target.name;

    if (!isInquiryField(fieldName)) {
      return;
    }

    createLeadMutation.reset();
    setFieldErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  }

  return (
    <main className="min-h-screen bg-[#f4f5f1] text-[#18201d] lg:grid lg:grid-cols-[minmax(20rem,0.85fr)_minmax(0,1.15fr)]">
      <section className="flex flex-col justify-between bg-[#16382f] px-5 py-6 text-white sm:px-8 sm:py-8 lg:min-h-screen lg:px-12 lg:py-10">
        <div>
          <p className="text-sm font-semibold text-[#f4c9b8]">TenantFlow</p>
          <p className="mt-4 max-w-sm text-2xl font-semibold leading-tight sm:text-3xl">
            A direct line to the leasing team.
          </p>
        </div>

        <div
          aria-hidden="true"
          className="relative mt-6 aspect-[16/8] overflow-hidden rounded-[6px] bg-[#c8d4c8] lg:mt-12 lg:aspect-[16/11]"
        >
          <div className="absolute inset-x-[11%] bottom-0 h-[84%] border-x-4 border-[#102e25] bg-[#f1eee3] px-[7%] pt-[8%]">
            <div className="grid h-[58%] grid-cols-4 gap-x-[9%] gap-y-[18%]">
              {Array.from({ length: 12 }, (_, index) => (
                <span
                  key={index}
                  className={
                    index % 4 === 1
                      ? "border-2 border-[#102e25] bg-[#d97a54]"
                      : "border-2 border-[#102e25] bg-[#98b8a5]"
                  }
                />
              ))}
            </div>
            <div className="absolute bottom-0 left-1/2 h-[29%] w-[18%] -translate-x-1/2 border-x-4 border-[#102e25] bg-[#e2a15f]" />
          </div>
          <div className="absolute inset-x-[7%] bottom-[84%] h-4 bg-[#b9c0b5]" />
          <div className="absolute bottom-0 left-[5%] h-[15%] w-[14%] bg-[#b34f32]" />
          <div className="absolute right-[4%] bottom-0 h-[23%] w-[16%] bg-[#6f8d79]" />
        </div>

        <p className="mt-5 max-w-sm text-sm leading-6 text-[#cddbd3] lg:mt-8">
          Choose an available home, then share your contact details and a short
          note.
        </p>
      </section>

      <section className="flex items-center bg-[#fbfcf9] px-5 py-10 sm:px-8 sm:py-14 lg:min-h-screen lg:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-2xl">
          <p className="text-sm font-semibold text-[#b34f32]">Rental inquiry</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#102e25] sm:text-4xl">
            Ask about a home
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#59665f]">
            The leasing team will use these details to respond and continue the
            screening conversation.
          </p>

          <form
            className="mt-8"
            noValidate
            aria-busy={isPending}
            onChange={handleFieldChange}
            onSubmit={handleSubmit}
          >
            <PropertyPicker
              fieldError={fieldErrors.propertyId}
              isPending={isPending}
              loadError={propertyLoadError}
              loadState={propertyLoadState}
              notice={displayedPropertyNotice}
              onChange={handlePropertyChange}
              onRetry={retryPropertyLoad}
              properties={properties}
              selectedPropertyId={selectedPropertyIdForRequest}
            />

            <div className="mt-7 grid gap-x-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  className="text-sm font-semibold text-[#26332e]"
                  htmlFor="name"
                >
                  Full name
                </label>
                <input
                  className={fieldClassName(Boolean(fieldErrors.name))}
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  disabled={isPending}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby="name-error"
                />
                <FieldError id="name-error" message={fieldErrors.name} />
              </div>

              <div>
                <label
                  className="text-sm font-semibold text-[#26332e]"
                  htmlFor="email"
                >
                  Email address
                </label>
                <input
                  className={fieldClassName(Boolean(fieldErrors.email))}
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  disabled={isPending}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby="email-error"
                />
                <FieldError id="email-error" message={fieldErrors.email} />
              </div>

              <div>
                <label
                  className="text-sm font-semibold text-[#26332e]"
                  htmlFor="phone"
                >
                  Phone number
                </label>
                <input
                  className={fieldClassName(Boolean(fieldErrors.phone))}
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  disabled={isPending}
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby="phone-error"
                />
                <FieldError id="phone-error" message={fieldErrors.phone} />
              </div>

              <div className="sm:col-span-2">
                <label
                  className="text-sm font-semibold text-[#26332e]"
                  htmlFor="message"
                >
                  Message
                </label>
                <textarea
                  className={`${fieldClassName(
                    Boolean(fieldErrors.message),
                  )} min-h-32 resize-y`}
                  id="message"
                  name="message"
                  rows={5}
                  required
                  disabled={isPending}
                  spellCheck
                  aria-invalid={Boolean(fieldErrors.message)}
                  aria-describedby="message-error"
                />
                <FieldError id="message-error" message={fieldErrors.message} />
              </div>
            </div>

            <div className="min-h-16" aria-live="polite">
              {requestError ? (
                <div
                  className="border-l-4 border-[#b34f32] bg-[#fff1ec] px-4 py-3 text-sm leading-6 text-[#7d301f]"
                  role="alert"
                >
                  {requestError}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-4 border-t border-[#d9ddd7] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-sm text-xs leading-5 text-[#68756f]">
                Your contact details are used only to respond to this rental
                inquiry.
              </p>
              <button
                className="inline-flex min-h-12 w-full max-w-full items-center justify-center gap-3 rounded-[6px] break-words bg-[#174c3b] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#10382b] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d97a54] disabled:cursor-not-allowed disabled:bg-[#9ba6a0] sm:w-auto sm:min-w-40"
                type="submit"
                disabled={isPending || !hasValidProperty}
              >
                {isPending ? (
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"
                  />
                ) : null}
                {isPending ? "Sending inquiry" : "Send inquiry"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

interface PropertyPickerProps {
  fieldError?: string;
  isPending: boolean;
  loadError: string | null;
  loadState: PropertyLoadState;
  notice: string | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRetry: () => void;
  properties: PublicPropertyResponse[];
  selectedPropertyId: string;
}

function PropertyPicker({
  fieldError,
  isPending,
  loadError,
  loadState,
  notice,
  onChange,
  onRetry,
  properties,
  selectedPropertyId,
}: PropertyPickerProps) {
  return (
    <fieldset
      className="border-y border-[#cbd1c9] py-5"
      disabled={isPending}
      aria-describedby="property-picker-status property-error"
    >
      <legend className="px-1 text-sm font-semibold text-[#26332e]">
        Available homes
      </legend>

      <div className="mt-3 min-h-60" aria-live="polite">
        {loadState === "loading" ? (
          <div
            className="flex min-h-60 items-center justify-center border border-[#d9ddd7] bg-[#f5f7f4] px-5 text-center"
            role="status"
          >
            <span
              aria-hidden="true"
              className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-[#2f765e] border-r-transparent"
            />
            <span className="text-sm font-medium text-[#52615a]">
              Loading available homes
            </span>
          </div>
        ) : null}

        {loadState === "error" ? (
          <div
            className="min-h-60 border border-[#d8a896] bg-[#fff3ee] px-5 py-5"
            role="alert"
          >
            <p className="text-sm font-semibold text-[#7d301f]">
              Available homes could not be loaded
            </p>
            <p className="mt-2 text-sm leading-6 break-words text-[#744638]">
              {loadError ?? "Check your connection and try again."}
            </p>
            <button
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[6px] border border-[#7d301f] bg-white px-4 py-2 text-sm font-semibold text-[#7d301f] hover:bg-[#fff8f5] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d97a54]"
              type="button"
              onClick={onRetry}
            >
              Try again
            </button>
          </div>
        ) : null}

        {loadState === "ready" && properties.length === 0 ? (
          <div className="flex min-h-60 items-center border border-[#d9ddd7] bg-[#f5f7f4] px-5 py-6">
            <div>
              <p className="text-sm font-semibold text-[#26332e]">
                No homes are available right now
              </p>
              <p className="mt-2 text-sm leading-6 text-[#637069]">
                New active rentals will appear here when they are listed.
              </p>
            </div>
          </div>
        ) : null}

        {loadState === "ready" && properties.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {properties.map((property) => {
              const isSelected = property.id === selectedPropertyId;
              const detailsId = `property-${property.id}-details`;

              return (
                <li className="min-w-0" key={property.id}>
                  <label
                    className={`block h-full cursor-pointer rounded-[8px] border p-4 transition-colors focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-[#d97a54] ${
                      isSelected
                        ? "border-[#2f765e] bg-[#edf7f1]"
                        : "border-[#cbd1c9] bg-white hover:border-[#78988a]"
                    } ${isPending ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    <span className="flex min-w-0 items-start gap-3">
                      <input
                        className="mt-1 h-5 w-5 shrink-0 accent-[#174c3b]"
                        type="radio"
                        name="propertyId"
                        value={property.id}
                        checked={isSelected}
                        onChange={onChange}
                        aria-describedby={detailsId}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-6 break-words text-[#18372e]">
                          {property.address}
                        </span>
                        <span className="mt-1 block text-sm leading-5 break-words text-[#5b6862]">
                          {property.unitDetails}
                        </span>
                      </span>
                    </span>
                    <span
                      className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#d9ddd7] pt-3 text-xs leading-5 text-[#53615b]"
                      id={detailsId}
                    >
                      <span className="font-semibold text-[#26332e]">
                        {formatMonthlyRent(property.monthlyRent)} / month
                      </span>
                      <span>{formatBedrooms(property.bedrooms)}</span>
                      <span>
                        Available {formatDateOnly(property.availableFrom)}
                      </span>
                      <span>{formatPetPolicy(property.petPolicy)}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <p
        className="min-h-6 pt-2 text-sm leading-5 break-words text-[#8b3c26]"
        id="property-picker-status"
        role={notice ? "alert" : undefined}
      >
        {notice ?? null}
      </p>
      <FieldError id="property-error" message={fieldError} />
    </fieldset>
  );
}

function replacePropertySearchParam(propertyId: string): void {
  const url = new URL(window.location.href);

  if (propertyId) {
    url.searchParams.set("propertyId", propertyId);
  } else {
    url.searchParams.delete("propertyId");
  }

  window.history.replaceState(window.history.state, "", url);
}

function readRequest(
  formData: FormData,
  propertyId: string,
): CreateLeadRequest {
  return {
    name: readFormValue(formData, "name"),
    email: readFormValue(formData, "email"),
    phone: readFormValue(formData, "phone"),
    message: readFormValue(formData, "message"),
    propertyId,
  };
}

function validateRequest(request: CreateLeadRequest): FieldErrors {
  const errors: FieldErrors = {};

  if (!request.name) {
    errors.name = "Enter your name.";
  }

  if (!request.email) {
    errors.email = "Enter your email address.";
  } else if (!EMAIL_PATTERN.test(request.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!request.phone) {
    errors.phone = "Enter your phone number.";
  }

  if (!request.message) {
    errors.message = "Enter a short message about this property.";
  }

  if (!UUID_PATTERN.test(request.propertyId)) {
    errors.propertyId = "Choose an available property.";
  }

  return errors;
}

function focusFirstInvalidField(
  form: HTMLFormElement,
  errors: FieldErrors,
): void {
  const firstInvalidField = INQUIRY_FIELDS.find((field) => errors[field]);

  if (!firstInvalidField) {
    return;
  }

  if (firstInvalidField === "propertyId") {
    form.querySelector<HTMLInputElement>('input[name="propertyId"]')?.focus();
    return;
  }

  const formControl = form.elements.namedItem(firstInvalidField);

  if (formControl instanceof HTMLElement) {
    formControl.focus();
  }
}

function readFormValue(formData: FormData, field: InquiryField): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function isInquiryField(value: string): value is InquiryField {
  return INQUIRY_FIELDS.some((field) => field === value);
}

function fieldClassName(hasError: boolean): string {
  return `mt-2 min-h-12 w-full rounded-[6px] border bg-white px-3.5 py-2.5 text-base text-[#18201d] outline-none transition-colors placeholder:text-[#89938e] focus:border-[#2f765e] focus:ring-3 focus:ring-[#d9e9df] disabled:cursor-not-allowed disabled:bg-[#eef0ed] disabled:text-[#68756f] ${
    hasError ? "border-[#b34f32]" : "border-[#aeb8b2]"
  }`;
}

interface FieldErrorProps {
  id: string;
  message?: string;
}

function FieldError({ id, message }: FieldErrorProps) {
  return (
    <p className="min-h-6 pt-1 text-sm text-[#9b3d27]" id={id}>
      {message ?? null}
    </p>
  );
}
