import { getRedisClient } from "@/lib/redis";

export type Language = "en" | "es";
export type LocalizedText = { en: string; es: string };
export type Question = {
  id: string;
  question: LocalizedText;
  options: LocalizedText[];
  correctOption: number;
  explanation: LocalizedText;
  source: { title: string; url: string };
};

export type PublicQuestion = { id: string; question: string; options: string[] };
export type QuestionResult = {
  id: string;
  question: string;
  selectedAnswer: string | null;
  correctAnswer: string;
  explanation: string;
  source: Question["source"];
  correct: boolean;
};
export type PracticeResult = { score: number; total: number; items: QuestionResult[]; page: number; pageSize: number; pageCount: number };

export const QUESTION_BANK_KEY = "exam-gcp:question-bank:v1";
let cachedBank: { value: Question[]; expiresAt: number } | undefined;

const text = (value: LocalizedText, language: Language) => value[language];

export async function getQuestionBank(): Promise<Question[]> {
  if (cachedBank && cachedBank.expiresAt > Date.now()) return cachedBank.value;
  const redis = await getRedisClient();
  const raw = await redis.get(QUESTION_BANK_KEY);
  if (!raw) throw new Error("Question bank is not seeded");
  const parsed: unknown = JSON.parse(raw);
  if (!isValidQuestionBank(parsed)) throw new Error("Question bank is invalid");
  cachedBank = { value: parsed, expiresAt: Date.now() + 5000 };
  return parsed;
}

export async function getPublicQuestions(language: Language = "en", providedQuestions?: Question[]): Promise<PublicQuestion[]> {
  const questions = providedQuestions ?? await getQuestionBank();
  return questions.map(({ id, question, options }) => ({ id, question: text(question, language), options: options.map((option) => text(option, language)) }));
}

export async function getPublicQuestionsInOrder(language: Language, questionOrder: string[], providedQuestions?: Question[]) {
  const questions = providedQuestions ?? await getQuestionBank();
  const byId = new Map(questions.map((question) => [question.id, question]));
  return questionOrder.map((id) => byId.get(id)).filter((question): question is Question => Boolean(question)).map(({ id, question, options }) => ({ id, question: text(question, language), options: options.map((option) => text(option, language)) }));
}

export async function getPublicQuestionAtIndex(language: Language, questionOrder: string[], index: number, providedQuestions?: Question[]) {
  const questions = providedQuestions ?? await getQuestionBank();
  const questionId = questionOrder[index];
  const question = questions.find((item) => item.id === questionId);
  if (!question) return null;
  return { id: question.id, question: text(question.question, language), options: question.options.map((option) => text(option, language)) };
}

async function evaluateResult(answers: Record<string, number>, language: Language, questionOrder?: string[], providedQuestions?: Question[]) {
  const questions = providedQuestions ?? await getQuestionBank();
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const orderedQuestions = questionOrder?.map((id) => questionById.get(id)).filter((question): question is Question => Boolean(question)) ?? questions;
  const items = orderedQuestions.map((item) => {
    const selectedOption = answers[item.id];
    return {
      id: item.id,
      question: text(item.question, language),
      selectedAnswer: selectedOption === undefined ? null : text(item.options[selectedOption], language) ?? null,
      correctAnswer: text(item.options[item.correctOption], language),
      explanation: text(item.explanation, language),
      source: item.source,
      correct: selectedOption === item.correctOption,
    };
  });
  return { score: items.filter((item) => item.correct).length, total: items.length, items };
}

export async function calculateResult(answers: Record<string, number>, language: Language = "en", page = 1, pageSize = 5, questionOrder?: string[], providedQuestions?: Question[]): Promise<PracticeResult> {
  const evaluated = await evaluateResult(answers, language, questionOrder, providedQuestions);
  const normalizedPageSize = Math.min(20, Math.max(1, Math.floor(pageSize)));
  const pageCount = Math.max(1, Math.ceil(evaluated.total / normalizedPageSize));
  const normalizedPage = Math.min(pageCount, Math.max(1, Math.floor(page)));
  const start = (normalizedPage - 1) * normalizedPageSize;
  return { ...evaluated, items: evaluated.items.slice(start, start + normalizedPageSize), page: normalizedPage, pageSize: normalizedPageSize, pageCount };
}

export async function isPracticeComplete(answers: Record<string, number>, providedQuestions?: Question[]) {
  const questions = providedQuestions ?? await getQuestionBank();
  return questions.length === Object.keys(answers).length && questions.every((question) => Number.isInteger(answers[question.id]) && answers[question.id] >= 0 && answers[question.id] < question.options.length);
}

export function isValidQuestionBank(bank: unknown): bank is Question[] {
  if (!Array.isArray(bank) || bank.length === 0) return false;

  return bank.every((item) => {
    if (!item || typeof item !== "object") return false;
    const question = item as Partial<Question>;
    return (
      typeof question.id === "string" &&
      question.id.length > 0 &&
      typeof question.question === "object" && question.question !== null &&
      typeof question.question.en === "string" && question.question.en.length > 0 &&
      typeof question.question.es === "string" && question.question.es.length > 0 &&
      Array.isArray(question.options) &&
      question.options.length >= 2 &&
      question.options.every((option) => typeof option === "object" && option !== null && typeof option.en === "string" && option.en.length > 0 && typeof option.es === "string" && option.es.length > 0) &&
      typeof question.correctOption === "number" &&
      Number.isInteger(question.correctOption) &&
      question.correctOption >= 0 &&
      question.correctOption < question.options.length &&
      typeof question.explanation === "object" && question.explanation !== null &&
      typeof question.explanation.en === "string" && question.explanation.en.length > 0 &&
      typeof question.explanation.es === "string" && question.explanation.es.length > 0 &&
      Boolean(question.source) &&
      typeof question.source?.title === "string" &&
      typeof question.source?.url === "string" &&
      question.source.url.startsWith("https://")
    );
  });
}
