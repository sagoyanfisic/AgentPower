import type { getRedisClient } from "@/lib/redis";
import type { Question } from "@/lib/questions";

export const QUESTION_STATS_KEY = "practice-stats:questions";
export const TOPIC_STATS_KEY = "practice-stats:topics";
const STATS_MARKER_PREFIX = "practice-stats:recorded:";
const STATS_TTL_SECONDS = 60 * 60 * 24 * 30;

type RedisClient = Awaited<ReturnType<typeof getRedisClient>>;

export function getQuestionTopic(question: Question) {
  const title = question.source.title.toLowerCase();
  if (/iam|service account|identity|secret|kms|binary authorization|resource hierarchy|organization policy/.test(title)) return "IAM y seguridad";
  if (/cloud build|artifact|cloud deploy|terraform/.test(title)) return "CI/CD y entrega";
  if (/kubernetes|gke|pod autoscaling/.test(title)) return "GKE y Kubernetes";
  if (/compute|instance group|load balancing|virtual private cloud|cloud run/.test(title)) return "Compute y redes";
  if (/pub\/sub|storage/.test(title)) return "Datos y mensajería";
  if (/sre|error budget|monitoring|logging|trace|profiler/.test(title)) return "SRE y observabilidad";
  if (/billing/.test(title)) return "Costos y gobierno";
  return question.source.title;
}

export async function recordPracticeResult(redis: RedisClient, sessionTokenHash: string, answers: Record<string, number>, questions: Question[]) {
  return recordResultInNamespace(redis, "global", sessionTokenHash, answers, questions);
}

export async function recordRoomPracticeResult(redis: RedisClient, roomId: string, sessionTokenHash: string, answers: Record<string, number>, questions: Question[]) {
  return recordResultInNamespace(redis, `room:${roomId}`, sessionTokenHash, answers, questions);
}

function statsKeys(namespace: string) {
  if (namespace === "global") return { questions: QUESTION_STATS_KEY, topics: TOPIC_STATS_KEY, marker: STATS_MARKER_PREFIX };
  return { questions: `practice-stats:${namespace}:questions`, topics: `practice-stats:${namespace}:topics`, marker: `practice-stats:${namespace}:recorded:` };
}

async function recordResultInNamespace(redis: RedisClient, namespace: string, sessionTokenHash: string, answers: Record<string, number>, questions: Question[]) {
  const keys = statsKeys(namespace);
  const markerKey = `${keys.marker}${sessionTokenHash}`;
  const recorded = await redis.set(markerKey, "1", { NX: true, EX: STATS_TTL_SECONDS });
  if (recorded !== "OK") return false;

  const pipeline = redis.multi();
  const topicCounts = new Map<string, { attempts: number; failures: number }>();
  for (const question of questions) {
    const failed = answers[question.id] !== question.correctOption;
    pipeline.hIncrBy(keys.questions, `${question.id}:attempts`, 1);
    if (failed) pipeline.hIncrBy(keys.questions, `${question.id}:failures`, 1);
    const topic = getQuestionTopic(question);
    const current = topicCounts.get(topic) ?? { attempts: 0, failures: 0 };
    current.attempts += 1;
    if (failed) current.failures += 1;
    topicCounts.set(topic, current);
  }
  for (const [topic, counts] of topicCounts) {
    pipeline.hIncrBy(keys.topics, `${topic}:attempts`, counts.attempts);
    pipeline.hIncrBy(keys.topics, `${topic}:failures`, counts.failures);
  }
  pipeline.expire(keys.questions, STATS_TTL_SECONDS);
  pipeline.expire(keys.topics, STATS_TTL_SECONDS);
  await pipeline.exec();
  return true;
}

function count(hash: Record<string, string>, key: string) {
  return Number.parseInt(hash[key] ?? "0", 10) || 0;
}

export async function readLearningStats(redis: RedisClient, questions: Question[]) {
  return readStatsInNamespace(redis, "global", questions);
}

export async function readRoomLearningStats(redis: RedisClient, roomId: string, questions: Question[]) {
  return readStatsInNamespace(redis, `room:${roomId}`, questions);
}

async function readStatsInNamespace(redis: RedisClient, namespace: string, questions: Question[]) {
  const keys = statsKeys(namespace);
  const [questionHash, topicHash] = await Promise.all([redis.hGetAll(keys.questions), redis.hGetAll(keys.topics)]);
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const questionStats = questions.map((question) => {
    const attempts = count(questionHash, `${question.id}:attempts`);
    const failures = count(questionHash, `${question.id}:failures`);
    return { id: question.id, question: question.question.en, topic: getQuestionTopic(question), attempts, failures, failureRate: attempts ? Math.round((failures / attempts) * 100) : 0 };
  }).filter((item) => item.attempts > 0).sort((a, b) => b.failures - a.failures || b.failureRate - a.failureRate || a.id.localeCompare(b.id));

  const topics = [...new Set(questions.map(getQuestionTopic))].map((topic) => {
    const attempts = count(topicHash, `${topic}:attempts`);
    const failures = count(topicHash, `${topic}:failures`);
    return { topic, attempts, failures, failureRate: attempts ? Math.round((failures / attempts) * 100) : 0 };
  }).filter((item) => item.attempts > 0).sort((a, b) => b.failures - a.failures || b.failureRate - a.failureRate || a.topic.localeCompare(b.topic));

  return { questions: questionStats, topics, totalAttempts: topics.reduce((sum, item) => sum + item.attempts, 0), totalFailures: topics.reduce((sum, item) => sum + item.failures, 0), knownQuestions: questionById.size };
}
