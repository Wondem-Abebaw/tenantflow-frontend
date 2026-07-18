import type {
  ConversationMessageResponse,
  LeadStateResponse,
  LeadStatus,
} from "@/lib/api/types";

export interface ScreeningChatState {
  status: LeadStatus;
  property: {
    address: string;
    unitDetails: string;
  };
  messages: ConversationMessageResponse[];
}

export function toScreeningChatState(
  leadState: LeadStateResponse,
): ScreeningChatState {
  return {
    status: leadState.profile.status,
    property: {
      address: leadState.property.address,
      unitDetails: leadState.property.unitDetails,
    },
    messages: leadState.conversation.messages,
  };
}
