"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { createLead } from "@/lib/api/leads";
import type { CreateLeadRequest } from "@/lib/api/types";

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

interface InquiryFormProps {
  propertyId: string;
}

export function InquiryForm({ propertyId }: InquiryFormProps) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const hasValidProperty = UUID_PATTERN.test(propertyId);
  const propertySelectionMessage = hasValidProperty
    ? "This inquiry is linked to the home selected on the property listing."
    : propertyId
      ? "The property selection link is invalid. Return to the listing and try again."
      : "No property is attached. Open the inquiry form from a property listing.";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const form = event.currentTarget;
    const request = readRequest(new FormData(form), propertyId);
    const errors = validateRequest(request);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      focusFirstInvalidField(form, errors);
      return;
    }

    setFieldErrors({});
    setRequestError(null);
    setIsPending(true);

    try {
      const response = await createLead(request);
      router.push(`/leads/${encodeURIComponent(response.leadId)}`);
    } catch (error: unknown) {
      setRequestError(getApiErrorMessage(error));
      setIsPending(false);
    }
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

    setRequestError(null);
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
          Share a few contact details and a short note about the home you
          selected.
        </p>
      </section>

      <section className="flex items-center bg-[#fbfcf9] px-5 py-10 sm:px-8 sm:py-14 lg:min-h-screen lg:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-2xl">
          <p className="text-sm font-semibold text-[#b34f32]">
            Rental inquiry
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#102e25] sm:text-4xl">
            Ask about this home
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#59665f]">
            The leasing team will use these details to respond and continue
            the screening conversation.
          </p>

          <form
            className="mt-8"
            noValidate
            aria-busy={isPending}
            onChange={handleFieldChange}
            onSubmit={handleSubmit}
          >
            <input type="hidden" name="propertyId" value={propertyId} />

            <div
              className="flex gap-3 border-y border-[#cbd1c9] py-4"
              role={hasValidProperty ? undefined : "alert"}
            >
              <span
                aria-hidden="true"
                className={`mt-1 h-3 w-3 shrink-0 rounded-[2px] ${
                  hasValidProperty ? "bg-[#2f765e]" : "bg-[#b34f32]"
                }`}
              />
              <div>
                <p className="text-sm font-semibold text-[#26332e]">
                  {hasValidProperty
                    ? "Property selected"
                    : "Property selection required"}
                </p>
                <p className="mt-1 text-sm leading-6 text-[#637069]">
                  {propertySelectionMessage}
                </p>
              </div>
            </div>

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
                <FieldError
                  id="message-error"
                  message={fieldErrors.message}
                />
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
    errors.propertyId = "Select a property from a valid listing link.";
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
