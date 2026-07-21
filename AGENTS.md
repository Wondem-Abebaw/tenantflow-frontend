# AGENTS.md - TenantFlow AI (Frontend)

This file guides any coding agent working in the TenantFlow AI frontend
repository. Read it fully before making changes. Keep it updated as the
application evolves. If you make an architectural or product decision that is
not reflected here, update this file in the same PR or commit.

**This repository is the frontend only.** It is a standalone Next.js
application that consumes the TenantFlow AI NestJS backend over HTTP. The
backend lives in a separate, independent repository. Do not add NestJS modules,
TypeORM entities, database migrations, cron jobs, Gemini prompts, Google
Calendar SDK calls, or SendGrid logic here.

## 1. Project Summary

TenantFlow AI automates the residential leasing intake and pre-qualification
funnel:

`Inquiry -> Conversational Screening -> Rule-Based Validation -> Viewing Booking -> Reminders`

The frontend supports two experiences:

1. A public tenant flow for submitting an inquiry, continuing the AI-assisted
   qualification conversation, reviewing the result, viewing alternative
   properties when rejected, and booking a tour when pre-qualified.
2. A property manager workspace for reviewing the lead pipeline, applicant
   details, qualification outcomes, conversation playback, and scheduled
   viewings.

The current demo is single-organization and single-manager with no login.
Design the UI so authentication and organization context can be introduced
later, but do not build fake authentication, role management, billing, or
multi-tenant switching now.

## 2. Repository Boundary

- The NestJS backend is the source of truth for data, status transitions,
  qualification decisions, availability, scheduling, and notifications.
- The frontend must use documented JSON API endpoints. It must never connect
  directly to PostgreSQL or duplicate backend persistence.
- The frontend must never call Gemini, Google Calendar, or SendGrid directly.
  Those integrations are private backend responsibilities.
- Do not place backend secrets in this repository. Values exposed with
  `NEXT_PUBLIC_` are visible to every browser user.
- Do not assume same-origin requests. Browser requests go to a separately
  configured backend origin.
- Do not add Next.js Route Handlers merely to mirror every backend route. Use
  the backend directly unless a genuine server-only frontend concern requires
  a route handler.

## 3. Tech Stack

- **Framework:** Next.js with the App Router
- **Language:** TypeScript with strict mode enabled
- **UI:** React using Server Components by default and Client Components only
  where browser state, forms, or interaction requires them
- **Package manager:** npm; confirm against the lockfile and do not mix package
  managers
- **API:** The separate NestJS JSON API
- **API contract:** Backend Swagger/OpenAPI at `/api/docs`
- **Validation:** Use the validation library already installed in the frontend
  repository. Do not add a second form/schema stack without a clear reason.
- **Styling:** Follow the scaffolded repository's styling system. Do not add a
  component framework or major styling dependency without flagging it first.
- **Icons:** Use `lucide-react` when it is already installed or approved. Do
  not hand-draw common interface icons.

Do not introduce a new state-management library, data-fetching library, UI
framework, or form framework before checking the existing dependencies and
patterns. Prefer the platform, React, and Next.js primitives for narrow needs.

## 4. Environment Configuration

The frontend currently needs one public environment variable:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

Add it to `.env.example` in the frontend repository. Normalize the base URL in
one configuration module and avoid scattering environment access throughout
components.

The backend must set:

```dotenv
ALLOWED_ORIGIN=http://localhost:3000
```

The values must match the actual frontend origin exactly. Do not work around
CORS with wildcard origins.

Never add backend-only values such as `GEMINI_API_KEY`,
`GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REFRESH_TOKEN`,
`SENDGRID_API_KEY`, database credentials, or `CRON_SECRET` to the frontend.

## 5. Backend API Contract

Swagger is the authoritative contract. Check it before implementing or
changing an API call. Current endpoints are:

| Method | Path                                 | Purpose                                                                  |
| ------ | ------------------------------------ | ------------------------------------------------------------------------ |
| `GET`  | `/health`                            | Confirm backend and database availability                                |
| `GET`  | `/properties`                        | List active properties available for a public tenant inquiry             |
| `POST` | `/leads`                             | Create a public tenant inquiry                                           |
| `POST` | `/leads/:leadId/messages`            | Add a tenant message and advance screening                               |
| `GET`  | `/leads/:leadId`                     | Fetch the complete lead, property, qualification, and conversation state |
| `GET`  | `/leads/:leadId/availability?days=N` | Fetch viewing slots for a `PRE_QUALIFIED` lead                           |
| `GET`  | `/leads/:leadId/viewing`             | Fetch the persisted scheduled viewing for confirmation                   |
| `POST` | `/leads/:leadId/schedule`            | Schedule one exact returned slot                                         |

The backend also exposes `POST /cron/send-reminders`, but that endpoint is for
GCP Cloud Scheduler and must never be called from browser UI.

### Lead Statuses

Treat these values as a closed enum:

```ts
type LeadStatus =
  | "INQUIRY"
  | "CHATTING"
  | "PRE_QUALIFIED"
  | "REJECTED"
  | "SCHEDULED"
  | "COMPLETED";
```

The frontend displays status but never transitions it directly. All
transitions belong to the backend `LeadStateMachineService`.

### Create Inquiry

`POST /leads`

```ts
interface CreateLeadRequest {
  name: string;
  email: string;
  phone: string;
  message: string;
  propertyId: string;
}

interface CreateLeadResponse {
  leadId: string;
  conversationId: string;
  status: "CHATTING";
  reply: string;
}
```

The backend rejects unknown request fields. Send only the documented payload. Inquiry creation persists the applicant message and the first backend-authored screening question, then moves the lead to `CHATTING`; the frontend must render that persisted assistant question rather than inventing qualification questions.

### Public Active Properties

`GET /properties` returns the active homes available for public inquiry. It
intentionally omits organization identifiers and internal qualification rules:

```ts
interface PublicPropertyResponse {
  id: string;
  address: string;
  unitDetails: string;
  availableFrom: string;
  monthlyRent: number;
  petPolicy: PetPolicy;
  bedrooms: number;
}
```

### Add Conversation Message

`POST /leads/:leadId/messages`

```ts
interface AddLeadMessageRequest {
  message: string;
}

type MissingQualificationField =
  "income" | "creditScoreEstimate" | "pets" | "moveInDate" | "hasCoSigner";

interface AddLeadMessageResponse {
  leadId: string;
  conversationId: string;
  status: LeadStatus;
  reply: string;
  missingFields: MissingQualificationField[];
  qualification: {
    passed: boolean;
    failedReasons: string[];
    alternativeProperties: PropertyResponse[];
  } | null;
}
```

The AI reply is display content, not trusted HTML. Render it as text unless the
backend later defines a safe structured rich-text contract.

### Complete Lead State

`GET /leads/:leadId` returns:

```ts
interface LeadStateResponse {
  profile: {
    id: string;
    organizationId: string;
    propertyId: string;
    name: string;
    email: string;
    phone: string;
    source: string;
    status: LeadStatus;
    createdAt: string;
    updatedAt: string;
  };
  property: PropertyResponse;
  qualification: {
    id: string;
    leadId: string;
    monthlyIncome: number;
    creditScoreEstimate: number;
    petCount: number;
    petType: string | null;
    desiredMoveInDate: string;
    hasCoSigner: boolean;
    passed: boolean;
    failedReasons: string[];
    evaluatedAt: string;
  } | null;
  conversation: {
    id: string;
    leadId: string;
    messages: Array<{
      role: "USER" | "ASSISTANT" | "SYSTEM";
      content: string;
      timestamp: string;
    }>;
    createdAt: string;
    updatedAt: string;
  };
}
```

Property values are:

```ts
type PetPolicy =
  "NO_PETS" | "CATS_ONLY" | "DOGS_ONLY" | "CATS_AND_DOGS" | "CASE_BY_CASE";

interface PropertyResponse {
  id: string;
  organizationId: string;
  address: string;
  unitDetails: string;
  availableFrom: string;
  monthlyRent: number;
  incomeMultiplier: number;
  minCreditScore: number;
  petPolicy: PetPolicy;
  bedrooms: number;
  isActive: boolean;
}
```

### Viewing Availability

`GET /leads/:leadId/availability?days=7`

```ts
interface AvailabilityResponse {
  leadId: string;
  days: number;
  timeZone: string;
  slotDurationMinutes: number;
  slots: Array<{
    start: string;
    end: string;
  }>;
}
```

This endpoint returns `403` unless the lead is `PRE_QUALIFIED`.

### Scheduled Viewing

`GET /leads/:leadId/viewing` returns the persisted `ViewingResponse` for a lead that has already booked. Use it to restore the exact confirmation after refresh; do not rely only on client state.

### Schedule Viewing

`POST /leads/:leadId/schedule`

```ts
interface ScheduleViewingRequest {
  start: string;
  end: string;
}

interface ViewingResponse {
  id: string;
  organizationId: string;
  leadId: string;
  scheduledAt: string;
  endsAt: string;
  timeZone: string;
  googleCalendarEventId: string | null;
  calendarEventLink: string | null;
  reminderSent: boolean;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
}
```

Submit the exact `start` and `end` strings returned by the availability
endpoint. Do not reconstruct, round, or shift a slot in the browser. Disable
the booking action while it is pending to reduce duplicate event creation.

## 6. API Client Architecture

- Put all HTTP access behind a typed client in `src/lib/api` or the equivalent
  established repository location.
- Keep endpoint functions independent from React so they can be reused from
  Server Components, Client Components, and tests.
- Build URLs with `URL` and `URLSearchParams`, not string concatenation.
- Set `Content-Type: application/json` for JSON request bodies.
- Parse successful and unsuccessful response bodies defensively.
- Use `AbortSignal` where route changes or repeated requests can make a request
  obsolete.
- Do not scatter raw `fetch()` calls across page and presentation components.
- Do not silently retry non-idempotent requests such as inquiry creation,
  message submission, or viewing scheduling.
- Refetch `GET /leads/:leadId` after a mutation when the complete backend state
  is needed. Do not guess the next status locally.

Define one normalized frontend error type that can represent both standard
Nest errors and Calendar integration errors:

```ts
interface ApiErrorShape {
  statusCode: number;
  error?: string;
  code?: string;
  message: string | string[];
  timestamp?: string;
  path?: string;
}
```

Calendar failures may include stable codes such as
`CALENDAR_AUTHORIZATION_FAILED`, `CALENDAR_RATE_LIMITED`,
`CALENDAR_CONFLICT`, `CALENDAR_SLOT_UNAVAILABLE`,
`CALENDAR_REQUEST_REJECTED`, `CALENDAR_UPSTREAM_UNAVAILABLE`, and
`CALENDAR_INVALID_RESPONSE`.

Map technical codes to concise user-facing messages while preserving useful
details for development logging. Never display stack traces or raw third-party
responses.

## 7. Application Structure

Prefer feature ownership over a large generic components folder. A suitable
starting structure is:

```text
src/
  app/
    inquiry/
    leads/[leadId]/
    manager/
  features/
    inquiry/
    conversation/
    qualification/
    viewings/
    manager-pipeline/
  components/
    ui/
  lib/
    api/
    config/
    formatting/
```

- Route files compose features and own route-level loading/error boundaries.
- Feature folders own domain components, hooks, and view models.
- `components/ui` contains genuinely reusable primitives, not domain logic.
- API transport types live near the API client. View-specific derived types
  live with the feature that uses them.
- Avoid circular imports and broad barrel files that hide ownership.

Use generated OpenAPI types if the repository adopts an approved generation
workflow. Until then, keep handwritten transport types aligned with Swagger
and update them whenever the backend contract changes.

## 8. Product Flows

### Tenant Inquiry and Chat

- The first usable screen should be the inquiry experience, not a marketing
  landing page.
- Validate fields for immediate feedback, but treat backend validation as
  authoritative.
- After inquiry creation, navigate to a stable route containing the returned
  `leadId`. The initial transcript already contains the backend-authored first
  screening question and the lead is `CHATTING`.
- Treat an unauthenticated `leadId` as sensitive access data. Do not send it to
  analytics, place it in public metadata, or log it unnecessarily.
- Render the persisted transcript from `GET /leads/:leadId`, not only messages
  held in local component state.
- Maintain message order from the API and use timestamps for display.
- Keep the composer disabled while a message request is pending.
- Show recoverable request failures beside the action that failed and preserve
  the applicant's unsent text.
- When `missingFields` is non-empty, continue the conversation using the
  backend-generated reply. Do not create qualification questions from
  hardcoded business rules.

### Qualification Outcome

- `PRE_QUALIFIED`: clearly offer viewing availability and scheduling.
- `REJECTED`: show the backend-provided failed reasons in respectful language
  and render `alternativeProperties` when available.
- Do not calculate income thresholds, credit decisions, pet compatibility, or
  move-in feasibility in the frontend.
- Do not relabel a rejected lead as eligible based on frontend calculations.
- Do not expose internal implementation details about Gemini or rule engine
  prompts to applicants.

### Viewing Booking

- Fetch availability only after the backend reports `PRE_QUALIFIED`.
- Display the backend-provided calendar timezone near slot choices.
- Use `Intl.DateTimeFormat` for date and time formatting.
- Group slots by date for scanning, with a clear selected state.
- Submit the exact selected interval to the scheduling endpoint.
- Handle `409 CALENDAR_SLOT_UNAVAILABLE` by explaining that the slot was taken
  and immediately refreshing availability.
- On success, show the confirmed date, time, property address, and calendar
  link when present.
- Once the lead becomes `SCHEDULED`, prevent additional booking attempts.
- Fetch `/leads/:leadId/viewing` for a scheduled lead so the confirmation date,
  interval, timezone, and calendar link survive page refreshes.

### Manager Workspace

- The manager experience should be quiet, dense, and work-focused: prioritize
  scanning, filtering, comparison, and repeated actions over decorative
  marketing composition.
- Pipeline columns must be derived from backend lead statuses, not an
  independent frontend workflow.
- Conversation playback must use the persisted transcript.
- Qualification results must display backend decisions and rule values.
- Dates, rents, statuses, pet policies, and credit values should use centralized
  formatters and labels.

The current backend does not yet expose manager list endpoints for all leads,
properties, or viewings, and it has no authentication. Do not hardcode a
dashboard dataset or query the database directly. Build the manager dashboard
only after the required backend contracts exist, or use clearly isolated
development fixtures when the user explicitly asks for a visual prototype.

## 9. UI and Interaction Principles

- Design the tenant flow mobile-first and keep the chat composer reachable and
  stable on small screens.
- Design manager screens for efficient desktop use while retaining functional
  narrow layouts.
- Use semantic HTML, visible focus states, keyboard-operable controls, and
  properly associated form labels.
- Meet WCAG AA color contrast for text and controls.
- Use icons for familiar tool actions and include accessible names/tooltips
  where the icon alone is not self-explanatory.
- Use buttons for commands and links for navigation.
- Use toggles or checkboxes for binary settings, segmented controls for small
  mode sets, and menus for larger option sets.
- Keep cards at 8px radius or less unless the established design system says
  otherwise.
- Do not nest cards inside cards or turn every page section into a floating
  card.
- Avoid oversized hero text, decorative gradients, blurred color blobs, and
  one-color interfaces.
- Do not place instructional feature descriptions or keyboard shortcut prose
  inside the product UI.
- Ensure loading, error, empty, disabled, success, and stale-data states are
  deliberately designed.
- Reserve stable space for asynchronous content so controls and message lists
  do not jump unexpectedly.
- Ensure text wraps within buttons, panels, messages, and status labels at all
  supported viewport sizes.

## 10. State and Data Handling

- Prefer server-rendered data where it improves initial load and does not
  conflict with interactive public flows.
- Keep temporary form state local to the feature that owns it.
- Do not introduce global state for data already owned by the URL or backend.
- Use URL parameters for shareable filters and selected manager views.
- Never mutate objects returned from the API in place.
- Keep transport data separate from formatted display values.
- ISO date-time strings from the API represent absolute instants. Parse them
  carefully and format them for the intended timezone.
- `availableFrom` and `desiredMoveInDate` are date-only values. Do not parse
  them as midnight UTC if that can shift the displayed calendar date.
- Currency formatting must use `Intl.NumberFormat`.

## 11. Security and Privacy

- Treat all API data as untrusted input when rendering.
- React's normal text rendering is preferred. Do not use
  `dangerouslySetInnerHTML` for conversation content or Gemini replies.
- Do not expose secrets through public environment variables, source code,
  browser logs, error messages, or analytics.
- Avoid logging applicant names, emails, phone numbers, income, credit
  estimates, conversation text, or lead IDs.
- Do not persist sensitive qualification data in `localStorage`.
- If the current lead ID must survive a refresh, prefer the route parameter and
  store no more applicant data than necessary in the browser.
- Authentication and authorization are not implemented in the demo. Clearly
  flag manager pages as demo-only until the backend provides protection.
- Do not imply that hidden navigation is access control.

## 12. Coding Conventions

- TypeScript strict mode stays enabled.
- Avoid `any`. Use `unknown` at external boundaries and narrow it.
- Keep components focused and name them by responsibility.
- Keep business decisions out of components and hooks.
- Prefer explicit props over components that read unrelated global state.
- Avoid effects for values that can be derived during render.
- Do not copy backend validation rules into the frontend. Client validation may
  check shape and basic usability, but eligibility remains backend-only.
- Keep user-facing labels centralized for backend enums.
- Add comments only when the reasoning is not evident from the code.
- Use path aliases consistently with the repository configuration.
- Preserve the existing formatter and lint rules.

## 13. Testing and Verification

At minimum, every completed change should pass:

```bash
npm run lint
npm run typecheck
npm run build
```

Use the exact scripts available in the repository. Add a `typecheck` script if
the scaffold does not provide one.

Testing effort should scale with risk:

- Test API error normalization and date-only/date-time formatting.
- Test status-driven rendering for `CHATTING`, `PRE_QUALIFIED`, `REJECTED`, and
  `SCHEDULED`.
- Test that scheduling submits the exact slot returned by availability.
- Test preservation of applicant input after recoverable request failures.
- Use end-to-end tests for the full inquiry -> chat -> qualification -> booking
  path once a stable backend test environment exists.

Before finishing visual work, inspect both mobile and desktop viewports and
verify there is no clipped text, overlapping UI, inaccessible control, blank
state, or layout shift caused by dynamic content.

## 14. What Not to Do

- Do not build backend code in this repository.
- Do not call Gemini, Google Calendar, SendGrid, PostgreSQL, or Cloud Scheduler
  from the frontend.
- Do not put eligibility logic in the UI or in frontend AI prompts.
- Do not transition lead statuses locally.
- Do not invent undocumented request fields or depend on undocumented response
  fields.
- Do not silently mock missing backend functionality in production paths.
- Do not expose the cron endpoint or cron secret in browser code.
- Do not add fake authentication that creates a false security boundary.
- Do not use wildcard CORS as a frontend workaround.
- Do not store applicant financial or credit data in browser persistence.
- Do not create a landing page when the requested work is the actual product
  experience.

## 15. Current Priorities

1. Scaffold the Next.js App Router project with strict TypeScript, linting,
   formatting, `.env.example`, and a typed API client.
2. Build the public inquiry form and create-lead flow.
3. Build tenant conversation playback and message submission.
4. Render qualification outcomes and alternative properties.
5. Build viewing availability selection and scheduling confirmation.
6. Add complete loading, validation, empty, and API error states.
7. Add manager pipeline and calendar experiences after the backend exposes the
   required authenticated list endpoints.

## 16. Open Questions and Assumptions

- Public active properties are available through `GET /properties`. Property
  listing entry points may pass `propertyId` to preselect an active property,
  and the inquiry flow also lets applicants choose from the API response.
- The backend currently has no manager authentication or authorization.
- The backend currently has no manager-wide lead, property, or viewing list
  endpoint for dashboard and calendar screens.
- Confirm product branding, design tokens, supported browsers, deployment
  target, analytics policy, and accessibility target when those decisions
  become necessary.
- When a backend contract is missing, make the gap explicit and coordinate the
  API addition instead of inventing a parallel frontend source of truth.

Make reasonable implementation assumptions when they are low risk, document
them in the PR or commit, and keep moving. Escalate only when an assumption
would alter the API contract, security boundary, or core product behavior.
