import type {
  AddLeadMessageResponse,
  ConversationMessageResponse,
  LeadStateResponse,
  LeadStatus,
  QualificationDecisionResponse,
} from "@/lib/api/types";

export type ScreeningQualificationOutcome = QualificationDecisionResponse;

export interface ScreeningChatState {
  status: LeadStatus;
  property: {
    address: string;
    unitDetails: string;
  };
  messages: ConversationMessageResponse[];
  qualification: ScreeningQualificationOutcome | null;
}

export function toScreeningChatState(
  leadState: LeadStateResponse,
  messageQualification?: ScreeningQualificationOutcome | null,
): ScreeningChatState {
  return {
    status: leadState.profile.status,
    property: {
      address: leadState.property.address,
      unitDetails: leadState.property.unitDetails,
    },
    messages: leadState.conversation.messages,
    qualification: toQualificationOutcome(leadState, messageQualification),
  };
}

export function applyMessageResponse(
  chatState: ScreeningChatState,
  response: AddLeadMessageResponse,
): ScreeningChatState {
  return {
    ...chatState,
    status: response.status,
    qualification: response.qualification ?? chatState.qualification,
  };
}

function toQualificationOutcome(
  leadState: LeadStateResponse,
  messageQualification?: ScreeningQualificationOutcome | null,
): ScreeningQualificationOutcome | null {
  if (!leadState.qualification) {
    return messageQualification ?? null;
  }

  const alternativeProperties =
    messageQualification?.passed === leadState.qualification.passed
      ? messageQualification.alternativeProperties
      : [];

  return {
    passed: leadState.qualification.passed,
    failedReasons: leadState.qualification.failedReasons,
    alternativeProperties,
  };
}
