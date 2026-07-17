export type LeadStatus =
  | "INQUIRY"
  | "CHATTING"
  | "PRE_QUALIFIED"
  | "REJECTED"
  | "SCHEDULED"
  | "COMPLETED";

export type PetPolicy =
  | "NO_PETS"
  | "CATS_ONLY"
  | "DOGS_ONLY"
  | "CATS_AND_DOGS"
  | "CASE_BY_CASE";

export type ConversationMessageRole = "USER" | "ASSISTANT" | "SYSTEM";

export type ViewingStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type CalendarErrorCode =
  | "CALENDAR_AUTHORIZATION_FAILED"
  | "CALENDAR_RATE_LIMITED"
  | "CALENDAR_CONFLICT"
  | "CALENDAR_SLOT_UNAVAILABLE"
  | "CALENDAR_REQUEST_REJECTED"
  | "CALENDAR_UPSTREAM_UNAVAILABLE"
  | "CALENDAR_INVALID_RESPONSE";

export interface HealthResponse {
  status: "ok";
  database: "connected";
}

export interface CreateLeadRequest {
  name: string;
  email: string;
  phone: string;
  message: string;
  propertyId: string;
}

export interface CreateLeadResponse {
  leadId: string;
  conversationId: string;
  status: "INQUIRY";
}

export interface AddLeadMessageRequest {
  message: string;
}

export type MissingQualificationField =
  | "income"
  | "creditScoreEstimate"
  | "pets"
  | "moveInDate"
  | "hasCoSigner";

export interface PropertyResponse {
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

export interface QualificationDecisionResponse {
  passed: boolean;
  failedReasons: string[];
  alternativeProperties: PropertyResponse[];
}

export interface AddLeadMessageResponse {
  leadId: string;
  conversationId: string;
  status: LeadStatus;
  reply: string;
  missingFields: MissingQualificationField[];
  qualification: QualificationDecisionResponse | null;
}

export interface LeadProfileResponse {
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
}

export interface QualificationResponse {
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
}

export interface ConversationMessageResponse {
  role: ConversationMessageRole;
  content: string;
  timestamp: string;
}

export interface ConversationResponse {
  id: string;
  leadId: string;
  messages: ConversationMessageResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadStateResponse {
  profile: LeadProfileResponse;
  property: PropertyResponse;
  qualification: QualificationResponse | null;
  conversation: ConversationResponse;
}

export interface AvailabilitySlotResponse {
  start: string;
  end: string;
}

export interface AvailabilityResponse {
  leadId: string;
  days: number;
  timeZone: string;
  slotDurationMinutes: number;
  slots: AvailabilitySlotResponse[];
}

export interface ScheduleViewingRequest {
  start: string;
  end: string;
}

export interface ViewingResponse {
  id: string;
  organizationId: string;
  leadId: string;
  scheduledAt: string;
  endsAt: string;
  googleCalendarEventId: string;
  calendarEventLink: string | null;
  reminderSent: boolean;
  status: ViewingStatus;
}
