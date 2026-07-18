import { formatDateTime } from "./date";

export function formatConversationTimestamp(timestamp: string): string {
  return formatDateTime(timestamp);
}
