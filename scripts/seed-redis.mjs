import { readFile } from "node:fs/promises";
import { createClient } from "redis";

const key = process.env.QUESTION_BANK_KEY ?? "exam-gcp:question-bank:v1";
const redis = createClient({ url: process.env.REDIS_URL ?? "redis://localhost:6379" });
redis.on("error", (error) => console.error("Redis seed error", error));

try {
  const content = await readFile("src/content/questions.json", "utf8");
  const bank = JSON.parse(content);
  if (!Array.isArray(bank) || bank.length === 0) throw new Error("El banco está vacío o no es un arreglo");
  const ids = new Set();
  for (const [index, question] of bank.entries()) {
    if (!question || typeof question.id !== "string" || ids.has(question.id)) throw new Error(`Pregunta inválida o ID duplicado en la posición ${index + 1}`);
    ids.add(question.id);
    const localized = (value) => value && typeof value === "object" && typeof value.en === "string" && value.en.length > 0 && typeof value.es === "string" && value.es.length > 0;
    if (!localized(question.question) || !Array.isArray(question.options) || question.options.length < 2 || question.options.some((option) => !localized(option)) || !Number.isInteger(question.correctOption) || question.correctOption < 0 || question.correctOption >= question.options.length || !localized(question.explanation) || !question.source || !/^https:\/\//.test(question.source.url ?? "")) {
      throw new Error(`Contenido inválido en la pregunta ${question.id}`);
    }
  }
  await redis.connect();
  await redis.set(key, JSON.stringify(bank));
  console.log(`Banco cargado en Redis: ${key} (${bank.length} preguntas).`);
} finally {
  if (redis.isOpen) await redis.quit();
}
