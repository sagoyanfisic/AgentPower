import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const contentPath = resolve("src/content/questions.json");
const raw = await readFile(contentPath, "utf8");
const bank = JSON.parse(raw);
const errors = [];

if (!Array.isArray(bank) || bank.length === 0) {
  errors.push("el banco debe ser un arreglo no vacío");
}

const ids = new Set();
for (const [index, item] of (Array.isArray(bank) ? bank : []).entries()) {
  const prefix = `pregunta ${index + 1}`;
  if (!item || typeof item !== "object") {
    errors.push(`${prefix}: debe ser un objeto`);
    continue;
  }
  if (typeof item.id !== "string" || item.id.length === 0) errors.push(`${prefix}: falta id`);
  if (ids.has(item.id)) errors.push(`${prefix}: id duplicado (${item.id})`);
  ids.add(item.id);
  const localized = (value) => value && typeof value === "object" && typeof value.en === "string" && value.en.length > 0 && typeof value.es === "string" && value.es.length > 0;
  if (!localized(item.question)) errors.push(`${prefix}: question debe incluir en y es`);
  if (!Array.isArray(item.options) || item.options.length < 2 || item.options.some((option) => !localized(option))) errors.push(`${prefix}: options debe contener textos en y es`);
  if (!Number.isInteger(item.correctOption) || item.correctOption < 0 || item.correctOption >= (item.options?.length ?? 0)) {
    errors.push(`${prefix}: correctOption no apunta a una opción válida`);
  }
  if (!localized(item.explanation)) errors.push(`${prefix}: explanation debe incluir en y es`);
  if (!item.source || typeof item.source.title !== "string" || !/^https:\/\//.test(item.source.url ?? "")) {
    errors.push(`${prefix}: source debe incluir title y una URL HTTPS`);
  }
}

if (errors.length > 0) {
  console.error("Banco de preguntas inválido:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Banco válido: ${bank.length} preguntas.`);
}
