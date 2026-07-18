"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { addLeadMessage, getLeadState } from "@/lib/api/leads";
import type {
  AddLeadMessageResponse,
  ConversationMessageResponse,
  LeadStatus,
} from "@/lib/api/types";
import { formatConversationTimestamp } from "@/lib/formatting/conversation-timestamp";
import { formatLeadStatus } from "@/lib/formatting/lead-status";

import { QualificationOutcome } from "../qualification/qualification-outcome";
import {
  applyMessageResponse,
  type ScreeningChatState,
  toScreeningChatState,
} from "./screening-chat-state";

const STATUS_STYLES: Readonly<Record<LeadStatus, string>> = {
  INQUIRY: "border-[#d7a45b] bg-[#fff4df] text-[#784b17]",
  CHATTING: "border-[#6b9d87] bg-[#e8f3ed] text-[#174c3b]",
  PRE_QUALIFIED: "border-[#6b9d87] bg-[#e8f3ed] text-[#174c3b]",
  REJECTED: "border-[#b8aaa4] bg-[#f2efed] text-[#5d514c]",
  SCHEDULED: "border-[#7890a0] bg-[#ebf1f4] text-[#344f60]",
  COMPLETED: "border-[#a7afaa] bg-[#f0f2f0] text-[#4f5a55]",
};

interface ScreeningChatProps {
  leadId: string;
  initialState: ScreeningChatState;
}

export function ScreeningChat({
  leadId,
  initialState,
}: ScreeningChatProps) {
  const [chatState, setChatState] = useState(initialState);
  const [draft, setDraft] = useState("");
  const [composerError, setComposerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTranscriptStale, setIsTranscriptStale] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const messages = chatState.messages;
  const canContinueScreening = isChatStatus(chatState.status);
  const composerDisabled =
    isPending ||
    isRefreshing ||
    isTranscriptStale ||
    !canContinueScreening;

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, chatState.status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (composerDisabled) {
      return;
    }

    const submittedMessage = draft.trim();

    if (!submittedMessage) {
      setComposerError("Enter a message before sending.");
      return;
    }

    setComposerError(null);
    setIsPending(true);

    let response: AddLeadMessageResponse;

    try {
      response = await addLeadMessage(leadId, { message: submittedMessage });
      setChatState((currentState) =>
        applyMessageResponse(currentState, response),
      );
    } catch (error: unknown) {
      setComposerError(getApiErrorMessage(error));
      setIsPending(false);
      return;
    }

    setDraft("");

    try {
      const persistedState = await getLeadState(leadId, { cache: "no-store" });
      setChatState(
        toScreeningChatState(persistedState, response.qualification),
      );
      setIsTranscriptStale(false);
    } catch {
      setIsTranscriptStale(true);
      setComposerError(
        "Your message was sent, but the conversation could not refresh.",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function handleRefreshTranscript() {
    if (isRefreshing) {
      return;
    }

    setComposerError(null);
    setIsRefreshing(true);

    try {
      const persistedState = await getLeadState(leadId, { cache: "no-store" });
      setChatState((currentState) =>
        toScreeningChatState(persistedState, currentState.qualification),
      );
      setIsTranscriptStale(false);
    } catch (error: unknown) {
      setComposerError(getApiErrorMessage(error));
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#f4f5f1] text-[#18201d]">
      <header className="sticky top-0 z-20 border-b border-[#cbd1c9] bg-[#fbfcf9]/95 px-5 py-4 backdrop-blur-sm sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#174c3b]">TenantFlow</p>
            <p className="truncate text-xs text-[#68756f]">
              Rental screening
            </p>
          </div>
          <span
            className={`max-w-44 shrink-0 rounded-[6px] border px-3 py-1.5 text-center text-xs font-semibold leading-4 ${STATUS_STYLES[chatState.status]}`}
          >
            {formatLeadStatus(chatState.status)}
          </span>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="border-b border-[#cbd1c9] bg-[#16382f] px-5 py-6 text-white sm:px-8 lg:min-h-[calc(100dvh-69px)] lg:border-r lg:border-b-0 lg:px-7 lg:py-8">
          <p className="text-xs font-semibold text-[#f4c9b8]">
            Selected home
          </p>
          <h1 className="mt-3 text-xl font-semibold leading-7 break-words">
            {chatState.property.address}
          </h1>
          <p className="mt-3 text-sm leading-6 break-words text-[#cddbd3]">
            {chatState.property.unitDetails}
          </p>

          <div
            aria-hidden="true"
            className="mt-6 grid h-16 grid-cols-6 gap-2 border-y border-[#537268] py-3 lg:mt-10 lg:h-24 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <span
                key={index}
                className={index === 4 ? "bg-[#d97a54]" : "bg-[#8eaa9b]"}
              />
            ))}
          </div>
        </aside>

        <section className="flex min-h-[calc(100dvh-69px)] flex-col bg-[#fbfcf9] lg:h-[calc(100dvh-69px)] lg:min-h-0">
          <div className="border-b border-[#d9ddd7] px-5 py-5 sm:px-8">
            <h2 className="text-lg font-semibold text-[#102e25]">
              Screening conversation
            </h2>
          </div>

          <div
            className="flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:min-h-0 lg:overflow-y-auto"
            aria-live="polite"
            aria-relevant="additions text"
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
              {messages.length > 0 ? (
                messages.map((message, index) => (
                  <ConversationMessage
                    key={`${message.timestamp}-${message.role}-${index}`}
                    message={message}
                  />
                ))
              ) : (
                <div className="border-l-4 border-[#d7a45b] px-4 py-3 text-sm leading-6 text-[#59665f]">
                  The conversation has not started yet.
                </div>
              )}
              <QualificationOutcome
                leadId={leadId}
                qualification={chatState.qualification}
                status={chatState.status}
              />
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {canContinueScreening ? (
            <form
              className="sticky bottom-0 border-t border-[#cbd1c9] bg-[#fbfcf9] px-4 py-4 sm:px-8 sm:py-5"
              aria-busy={isPending || isRefreshing}
              onSubmit={handleSubmit}
            >
              <div className="mx-auto w-full max-w-3xl">
                <label
                  className="text-sm font-semibold text-[#26332e]"
                  htmlFor="screening-message"
                >
                  Your message
                </label>
                <textarea
                  className="mt-2 min-h-24 w-full resize-y rounded-[6px] border border-[#aeb8b2] bg-white px-3.5 py-3 text-base leading-6 text-[#18201d] outline-none transition-colors focus:border-[#2f765e] focus:ring-3 focus:ring-[#d9e9df] disabled:cursor-not-allowed disabled:bg-[#eef0ed]"
                  id="screening-message"
                  name="message"
                  rows={3}
                  value={draft}
                  disabled={composerDisabled}
                  onChange={(event) => {
                    setDraft(event.target.value);

                    if (!isTranscriptStale) {
                      setComposerError(null);
                    }
                  }}
                />

                <div className="min-h-12 pt-2" aria-live="polite">
                  {composerError ? (
                    <div className="flex flex-col gap-2 border-l-4 border-[#b34f32] bg-[#fff1ec] px-3 py-2.5 text-sm leading-6 text-[#7d301f] sm:flex-row sm:items-center sm:justify-between">
                      <p role="alert">{composerError}</p>
                      {isTranscriptStale ? (
                        <button
                          className="self-start font-semibold text-[#7d301f] underline decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d97a54] disabled:cursor-not-allowed disabled:opacity-60 sm:self-center"
                          type="button"
                          disabled={isRefreshing}
                          onClick={handleRefreshTranscript}
                        >
                          {isRefreshing ? "Refreshing" : "Refresh conversation"}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-[6px] bg-[#174c3b] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#10382b] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d97a54] disabled:cursor-not-allowed disabled:bg-[#9ba6a0] sm:w-auto sm:min-w-44"
                    type="submit"
                    disabled={composerDisabled || draft.trim().length === 0}
                  >
                    {isPending ? <PendingIndicator /> : null}
                    {isPending ? "Waiting for reply" : "Send message"}
                  </button>
                </div>
              </div>
            </form>
          ) : composerError ? (
            <div className="border-t border-[#cbd1c9] bg-[#fbfcf9] px-4 py-4 sm:px-8">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 border-l-4 border-[#b34f32] bg-[#fff1ec] px-3 py-2.5 text-sm leading-6 text-[#7d301f] sm:flex-row sm:items-center sm:justify-between">
                <p role="alert">{composerError}</p>
                {isTranscriptStale ? (
                  <button
                    className="self-start font-semibold text-[#7d301f] underline decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d97a54] disabled:cursor-not-allowed disabled:opacity-60 sm:self-center"
                    type="button"
                    disabled={isRefreshing}
                    onClick={handleRefreshTranscript}
                  >
                    {isRefreshing ? "Refreshing" : "Refresh conversation"}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function ConversationMessage({
  message,
}: {
  message: ConversationMessageResponse;
}) {
  const isApplicant = message.role === "USER";
  const isSystem = message.role === "SYSTEM";
  const roleLabel = isApplicant
    ? "You"
    : isSystem
      ? "Update"
      : "Leasing assistant";
  const alignmentClass = isSystem
    ? "justify-center"
    : isApplicant
      ? "justify-end"
      : "justify-start";
  const bubbleClass = isSystem
    ? "border border-[#cbd1c9] bg-[#eef2ee] text-[#46534d]"
    : isApplicant
      ? "bg-[#174c3b] text-white"
      : "border border-[#d9ddd7] bg-white text-[#26332e]";

  return (
    <article className={`flex ${alignmentClass}`}>
      <div className={`max-w-[88%] sm:max-w-[76%] ${isSystem ? "w-full" : ""}`}>
        <div
          className={`rounded-[8px] px-4 py-3 text-sm leading-6 shadow-[0_1px_0_rgba(24,32,29,0.04)] ${bubbleClass}`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div
          className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-1 px-1 text-xs text-[#738079] ${
            isApplicant ? "justify-end" : "justify-start"
          }`}
        >
          <span>{roleLabel}</span>
          <time dateTime={message.timestamp} suppressHydrationWarning>
            {formatConversationTimestamp(message.timestamp)}
          </time>
        </div>
      </div>
    </article>
  );
}

function PendingIndicator(): ReactNode {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"
    />
  );
}

function isChatStatus(status: LeadStatus): boolean {
  return status === "INQUIRY" || status === "CHATTING";
}
