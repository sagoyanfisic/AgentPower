export const avatars = ["🧑‍💻", "👩‍🚀", "🧑‍🔬", "👨‍💼", "👩‍💻", "🦊"] as const;
export const SESSION_COOKIE = "gcp_practice_session";

export type Answers = Record<string, number>;

export type PracticeSession = {
  started: boolean;
  profileReady: boolean;
  firstName: string;
  lastName: string;
  avatar: string;
  current: number;
  questionOrder: string[];
  answers: Answers;
  finished: boolean;
  roomId?: string;
  participantId?: string;
  startedAt?: string;
  deadlineAt?: string;
  finishedAt?: string;
  finishedReason?: "completed" | "timeout" | "closed";
  questionBankVersion?: string;
};
