import type { Question } from "@/lib/questions";
import { avatars, type PracticeSession } from "@/lib/session-types";
export type { Answers, PracticeSession } from "@/lib/session-types";

export function isValidPracticeSession(value: unknown, questions: Question[]): value is PracticeSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<PracticeSession>;
  if (
    typeof session.started !== "boolean" ||
    typeof session.profileReady !== "boolean" ||
    typeof session.firstName !== "string" || session.firstName.length > 80 || (session.profileReady && session.firstName.trim().length === 0) ||
    typeof session.lastName !== "string" || session.lastName.length > 120 || (session.profileReady && session.lastName.trim().length === 0) ||
    typeof session.avatar !== "string" ||
    !avatars.includes(session.avatar as (typeof avatars)[number]) ||
    typeof session.current !== "number" ||
    !Number.isInteger(session.current) ||
    session.current < 0 ||
    session.current >= questions.length ||
    !Array.isArray(session.questionOrder) ||
    session.questionOrder.length !== questions.length ||
    new Set(session.questionOrder).size !== questions.length ||
    session.questionOrder.some((id) => typeof id !== "string" || !questions.some((question) => question.id === id)) ||
    !session.answers ||
    typeof session.answers !== "object" ||
    typeof session.finished !== "boolean"
  ) return false;

  if (session.roomId !== undefined && (typeof session.roomId !== "string" || !/^[A-Za-z0-9_-]{8,32}$/.test(session.roomId))) return false;
  if (session.participantId !== undefined && (typeof session.participantId !== "string" || session.participantId.length < 16 || session.participantId.length > 128)) return false;
  for (const field of [session.startedAt, session.deadlineAt, session.finishedAt]) {
    if (field !== undefined && (typeof field !== "string" || Number.isNaN(Date.parse(field)))) return false;
  }
  if (session.finishedReason !== undefined && !["completed", "timeout", "closed"].includes(session.finishedReason)) return false;
  if (session.roomId && (!session.participantId || !session.startedAt || !session.deadlineAt || !session.questionBankVersion)) return false;

  return Object.entries(session.answers).every(([questionId, option]) => {
    const question = questions.find((item) => item.id === questionId);
    if (!question) return false;
    return Number.isInteger(option) && option >= 0 && option < question.options.length;
  });
}
