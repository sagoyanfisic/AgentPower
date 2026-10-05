"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { avatars, type Answers, type PracticeSession } from "@/lib/session-types";
import type { Language, PracticeResult, PublicQuestion } from "@/lib/questions";

type Room = { roomId: string; name: string; certification: string; startsAt: string; endsAt: string; durationMinutes: number; status: "scheduled" | "active" | "closed" };

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatar, setAvatar] = useState<string>(avatars[0]);
  const [language, setLanguage] = useState<Language>("en");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [finalizing, setFinalizing] = useState(false);
  const copy = language === "en" ? {
    scheduled: "scheduled", closed: "closed", active: "active", duration: "Duration", roomNotOpen: "The room is not open yet.", roomEnded: "The room has ended.", firstName: "First name", lastName: "Last name", chooseAvatar: "Choose your avatar", startExam: "Start exam", result: "Result", correctAnswers: "correct answers", yourAnswer: "Your answer:", correctAnswer: "Correct answer:", readDocs: "Read documentation ↗", previous: "← Previous", next: "Next →", page: "Page", question: "Question", timeLeft: "Time remaining", timeWarning: "Only", fiveMinuteWarning: "Five minutes left", seconds: "seconds left", saved: "Saved", saving: "Saving…", saveError: "Could not save", retry: "Retry", completed: "Completed", timeout: "Time expired", closedResult: "Room closed", answered: "answered", unanswered: "unanswered", correct: "Correct", review: "Review this question", unansweredLabel: "Not answered", viewResult: "View result", finalizing: "Calculating result…", nextQuestion: "Next question", independent: "Independent practice content. Always consult the official documentation to learn more."
  } : {
    scheduled: "programada", closed: "cerrada", active: "activa", duration: "Duración", roomNotOpen: "La sala todavía no está abierta.", roomEnded: "La sala ya terminó.", firstName: "Nombre", lastName: "Apellidos", chooseAvatar: "Elige tu avatar", startExam: "Comenzar examen", result: "Resultado", correctAnswers: "respuestas correctas", yourAnswer: "Tu respuesta:", correctAnswer: "Respuesta correcta:", readDocs: "Leer documentación ↗", previous: "← Anterior", next: "Siguiente", page: "Página", question: "Pregunta", timeLeft: "Tiempo restante", timeWarning: "Solo quedan", fiveMinuteWarning: "Faltan cinco minutos", seconds: "segundos", saved: "Guardado", saving: "Guardando…", saveError: "No se pudo guardar", retry: "Reintentar", completed: "Completado", timeout: "Tiempo agotado", closedResult: "Sala cerrada", answered: "respondidas", unanswered: "sin responder", correct: "Correcta", review: "Revisar esta pregunta", unansweredLabel: "Sin responder", viewResult: "Ver resultado", finalizing: "Calculando resultado…", nextQuestion: "Siguiente pregunta", independent: "Contenido de práctica independiente. Consulta siempre la documentación oficial para profundizar."
  };

  async function loadRoom() {
    const response = await fetch(`/api/room/${roomId}/session`, { cache: "no-store" });
    const data = await response.json() as { room?: Room; session?: PracticeSession | null; error?: string };
    if (!response.ok || !data.room) throw new Error(data.error ?? "Sala no encontrada");
    setRoom(data.room);
    if (data.session) {
      setSession(data.session);
      setFirstName(data.session.firstName);
      setLastName(data.session.lastName);
      setAvatar(data.session.avatar);
      setAnswers(data.session.answers);
      setCurrent(data.session.current);
      if (data.session.finished) await loadResult(1);
      else await loadQuestion(data.session.current);
    }
  }

  async function loadQuestion(index: number, nextLanguage: Language = language) {
    const response = await fetch(`/api/room/${roomId}/questions?lang=${nextLanguage}&index=${index}`, { cache: "no-store" });
    if (!response.ok) throw new Error(response.status === 410 ? "El tiempo de la sala terminó." : "No se pudieron cargar las preguntas.");
    const data = await response.json() as { question: PublicQuestion; total: number };
    setQuestion(data.question);
    setTotalQuestions(data.total);
  }

  async function loadResult(page: number, nextLanguage: Language = language) {
    const response = await fetch(`/api/room/${roomId}/result?lang=${nextLanguage}&page=${page}&pageSize=5`, { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo cargar el resultado.");
    setResult(await response.json());
  }

  useEffect(() => {
    // Loading route data is an external synchronization and sets state when it resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRoom().catch((cause: unknown) => {
      if (cause instanceof Error && cause.message === "Sala no encontrada") {
        router.replace("/?roomError=not-found");
        return;
      }
      setError(cause instanceof Error ? cause.message : "No se pudo cargar la sala.");
    }).finally(() => setLoading(false));
  // The room ID is stable for this route.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, router]);

  useEffect(() => {
    if (!session?.deadlineAt || session.finished) return;
    let finalizationRequested = false;
    const update = () => {
      const value = Math.max(0, Date.parse(session.deadlineAt!) - Date.now());
      setRemaining(value);
      if (value === 0 && !finalizationRequested) {
        finalizationRequested = true;
        void loadResult(1).then(() => setSession((previous) => previous ? { ...previous, finished: true, finishedReason: "timeout" } : previous)).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "No se pudo cargar el resultado."));
      }
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.deadlineAt, session?.finished]);

  useEffect(() => {
    if (!session) return;
    const sendPresence = () => {
      void fetch(`/api/presence/room/${roomId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visible: document.visibilityState === "visible", focused: document.hasFocus() }), keepalive: true });
    };
    sendPresence();
    const interval = window.setInterval(sendPresence, 15000);
    document.addEventListener("visibilitychange", sendPresence);
    window.addEventListener("focus", sendPresence);
    window.addEventListener("blur", sendPresence);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", sendPresence);
      window.removeEventListener("focus", sendPresence);
      window.removeEventListener("blur", sendPresence);
      void fetch(`/api/presence/room/${roomId}`, { method: "DELETE", keepalive: true });
    };
  }, [roomId, session]);

  async function saveProgress() {
    setSaveState("saving");
    try {
      const response = await fetch(`/api/room/${roomId}/session`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current, answers }) });
      if (!response.ok) throw new Error("No se pudo guardar la respuesta.");
    } catch {
      setSaveState("error");
      setError("No se pudo guardar la respuesta.");
      return false;
    }
    setSaveState("saved");
    setError("");
    return true;
  }

  const timeLabel = useMemo(() => {
    if (remaining === null) return "";
    const totalSeconds = Math.ceil(remaining / 1000);
    return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
  }, [remaining]);

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const response = await fetch(`/api/room/${roomId}/session`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName, lastName, avatar }) });
    const data = await response.json() as { session?: PracticeSession; error?: string };
    if (!response.ok || !data.session) { setError(data.error ?? "No se pudo iniciar la sala."); return; }
    setSession(data.session);
    await loadQuestion(0);
  }

  async function next() {
    if (!question || finalizing) return;
    if (current < totalQuestions - 1) { const nextIndex = current + 1; if (!(await saveProgress())) return; try { setCurrent(nextIndex); await loadQuestion(nextIndex); } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "No se pudo cargar la pregunta."); } return; }
    setFinalizing(true);
    setError("");
    try {
      if (!(await saveProgress())) { setError("No se pudo guardar la última respuesta."); return; }
      const response = await fetch(`/api/room/${roomId}/result`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language, answers }), signal: AbortSignal.timeout(15000) });
      const data = await response.json() as { score?: number; error?: string };
      if (!response.ok) { setError(data.error ?? "La sesión todavía no puede finalizar."); return; }
      setResult(data as PracticeResult);
      setSession((value) => value ? { ...value, finished: true, finishedReason: "completed" } : value);
    } catch {
      setError("No se pudo finalizar el examen. Comprueba tu conexión y vuelve a intentarlo.");
    } finally {
      setFinalizing(false);
    }
  }

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    if (session) void loadQuestion(current, nextLanguage);
    if (result) void loadResult(result.page, nextLanguage);
  }

  if (loading) return <main className="shell"><p className="setup-lead">Cargando sala…</p></main>;
  if (error && !room) return <main className="shell"><section className="setup-card"><h1>Sala no disponible</h1><p className="setup-lead">{error}</p><button className="secondary-button" type="button" onClick={() => window.location.reload()}>{copy.retry}</button></section></main>;
  if (!room) return null;
  const answeredCount = session ? Object.keys(session.answers).length : 0;
  const resultPercentage = result?.total ? Math.round((result.score / result.total) * 100) : 0;
  const incorrectCount = result ? Math.max(0, answeredCount - result.score) : 0;
  const unansweredCount = result ? Math.max(0, result.total - answeredCount) : 0;

  return <main className="shell room-shell">
    <header className="topbar"><Link className="brand-lockup" href="/"><span className="brand-mark">A</span><span><strong>AgentPower</strong><small>GDG Open · Certification Lab</small></span></Link><div className="topbar-actions"><span className="status-dot">Room {room.roomId}</span><div className="language-switch" aria-label="Language / Idioma"><span className="language-label">Idioma</span><button type="button" className={language === "en" ? "active" : ""} onClick={() => changeLanguage("en")} aria-pressed={language === "en"}>EN</button><button type="button" className={language === "es" ? "active" : ""} onClick={() => changeLanguage("es")} aria-pressed={language === "es"}>ES</button></div></div></header>
    {error && room && <div className="room-error" role="alert"><span>{error}</span><button className="secondary-button" type="button" onClick={() => window.location.reload()}>{copy.retry}</button></div>}
    {!session ? <section className="setup-card" aria-labelledby="room-title">
      <p className="kicker">{room.certification}</p><h1 id="room-title">{room.name}</h1>
      <p className="setup-lead">{room.status === "scheduled" ? copy.scheduled : room.status === "closed" ? copy.closed : copy.active}. {copy.duration}: {room.durationMinutes} {language === "en" ? "minutes" : "minutos"}.</p>
      {room.status === "scheduled" && <p className="room-notice">{copy.roomNotOpen}</p>}
      {room.status === "closed" && <p className="room-notice">{copy.roomEnded}</p>}
      {room.status === "active" && <form onSubmit={start}><div className="form-grid"><label>{copy.firstName}<input value={firstName} maxLength={80} onChange={(event) => setFirstName(event.target.value)} required /></label><label>{copy.lastName}<input value={lastName} maxLength={120} onChange={(event) => setLastName(event.target.value)} required /></label></div><fieldset><legend>{copy.chooseAvatar}</legend><div className="avatar-options">{avatars.map((option) => <button type="button" className={`avatar-option ${avatar === option ? "selected" : ""}`} key={option} onClick={() => setAvatar(option)} aria-pressed={avatar === option}>{option}</button>)}</div></fieldset><button className="primary-button" type="submit">{copy.startExam} →</button></form>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </section> : result ? <section className="results" aria-labelledby="room-result-title"><div className="profile-chip"><span>{avatar}</span>{firstName} {lastName}</div><p className="kicker">{room.name}</p><h1 id="room-result-title">{copy.result}</h1><div className="result-overview"><div className="score-card"><span className="score-value">{result.score}/{result.total}</span><span className="score-label">{copy.correctAnswers} · {resultPercentage}%</span></div><div className="result-stats" aria-label="Resumen del resultado"><article className="result-stat correct"><strong>{result.score}</strong><span>{copy.correct}</span></article><article className="result-stat incorrect"><strong>{incorrectCount}</strong><span>{copy.review}</span></article><article className="result-stat unanswered"><strong>{unansweredCount}</strong><span>{copy.unansweredLabel}</span></article></div></div><div className="result-progress" aria-label={`${resultPercentage}%`}><span style={{ width: `${resultPercentage}%` }} /></div><p className="result-status">{session.finishedReason === "timeout" ? copy.timeout : session.finishedReason === "closed" ? copy.closedResult : copy.completed}</p><div className="result-summary"><span><strong>{answeredCount}</strong> {copy.answered}</span><span><strong>{unansweredCount}</strong> {copy.unanswered}</span></div><div className="review-list">{result.items.map((item, index) => <article className="review-item" key={item.id}><div className={`result-mark ${item.correct ? "correct" : "incorrect"}`}>{item.correct ? "✓" : "×"}</div><div><p className={`review-status ${item.correct ? "correct" : item.selectedAnswer === null ? "unanswered" : "incorrect"}`}>{item.correct ? copy.correct : item.selectedAnswer === null ? copy.unansweredLabel : copy.review}</p><p className="review-index">{copy.question} {(result.page - 1) * result.pageSize + index + 1}</p><h2>{item.question}</h2><p className={`answer-line ${item.correct ? "answer-correct" : "answer-wrong"}`}><strong>{copy.yourAnswer}</strong> {item.selectedAnswer ?? (language === "en" ? "No answer" : "Sin respuesta")}</p><p className="answer-line answer-correct"><strong>{copy.correctAnswer}</strong> {item.correctAnswer}</p><p className="explanation">{item.explanation}</p><a href={item.source.url} target="_blank" rel="noreferrer">{copy.readDocs}</a></div></article>)}</div><nav className="review-pagination"><button className="secondary-button" disabled={result.page === 1} onClick={() => void loadResult(result.page - 1)}>{copy.previous}</button><span>{copy.page} {result.page} {language === "en" ? "of" : "de"} {result.pageCount}</span><button className="secondary-button" disabled={result.page === result.pageCount} onClick={() => void loadResult(result.page + 1)}>{copy.next}</button></nav></section> : question ? <section className="quiz" aria-labelledby="room-question-title"><div className="profile-chip"><span>{avatar}</span>{firstName} {lastName}</div><div className="room-timer" aria-live="polite">{copy.timeLeft} <strong>{timeLabel}</strong></div>{saveState !== "idle" && <span className={`save-state ${saveState}`}>{saveState === "saving" ? copy.saving : saveState === "saved" ? copy.saved : copy.saveError}</span>}{finalizing && <p className="save-state saving" role="status" aria-live="polite">{copy.finalizing}</p>}{remaining !== null && remaining > 0 && remaining <= 60_000 && <div className="time-warning" role="status" aria-live="polite">⚠ {copy.timeWarning} {Math.ceil(remaining / 1000)} {copy.seconds}</div>}<div className="quiz-meta"><span>{copy.question} {current + 1} {language === "en" ? "of" : "de"} {totalQuestions}</span><span>{Math.round(((current + 1) / totalQuestions) * 100)}%</span></div><div className="progress"><span style={{ width: `${((current + 1) / totalQuestions) * 100}%` }} /></div><div className="question-card"><p className="kicker">{room.name}</p><h1 id="room-question-title">{question.question}</h1><div className="options" role="radiogroup">{question.options.map((option, index) => <button role="radio" aria-checked={answers[question.id] === index} className={`option ${answers[question.id] === index ? "selected" : ""}`} key={option} onClick={() => setAnswers((previous) => ({ ...previous, [question.id]: index }))}><span className="option-key">{String.fromCharCode(65 + index)}</span><span>{option}</span></button>)}</div><button className="primary-button next-button" onClick={() => void next()} disabled={answers[question.id] === undefined || finalizing}>{finalizing ? copy.finalizing : current === totalQuestions - 1 ? copy.viewResult : copy.nextQuestion} →</button></div></section> : null}
    <footer>{copy.independent}</footer>
  </main>;
}
