"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function RoomEntry({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [submitting, setSubmitting] = useState(false);

  function enterRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedRoomId = roomId.trim().toUpperCase();
    if (!normalizedRoomId) {
      setError("Ingresa el código de la sala para continuar.");
      return;
    }
    setError("");
    setSubmitting(true);
    void validateAndEnter(normalizedRoomId);
  }

  async function validateAndEnter(normalizedRoomId: string) {
    try {
      const response = await fetch(`/api/room/${encodeURIComponent(normalizedRoomId)}/session`, { cache: "no-store" });
      const data = await response.json() as { room?: { status?: "scheduled" | "active" | "closed" }; error?: string };
      if (!response.ok || !data.room) {
        setError(response.status === 429 ? "Espera un momento e inténtalo de nuevo." : data.error ?? "No encontramos esa sala.");
        setSubmitting(false);
        return;
      }
      if (data.room.status === "scheduled") {
        setError("La sala todavía no está abierta. Inténtalo durante el horario indicado.");
        setSubmitting(false);
        return;
      }
      if (data.room.status === "closed") {
        setError("La sala ya cerró y no acepta nuevos participantes.");
        setSubmitting(false);
        return;
      }
      router.push(`/room/${encodeURIComponent(normalizedRoomId)}`);
    } catch {
      setError("No pudimos validar la sala. Revisa tu conexión e inténtalo de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <section className="room-entry" aria-labelledby="room-entry-title">
      <div className="room-entry-topline"><span className="entry-icon" aria-hidden="true">↗</span><span>Acceso con invitación</span></div>
      <p className="kicker">Acceso a práctica</p>
      <h2 id="room-entry-title">Ingresa tu código de sala</h2>
      <p>El código aparece en el enlace que te compartió el organizador.</p>
      <form onSubmit={enterRoom} noValidate>
        <label htmlFor="room-id">Room ID</label>
        <input id="room-id" value={roomId} onChange={(event) => { setRoomId(event.target.value); if (error) setError(""); }} onBlur={() => { if (!roomId.trim()) setError("Ingresa el código de la sala para continuar."); }} placeholder="Ej. ROOM-7FF097218BB9" autoComplete="off" spellCheck={false} aria-invalid={Boolean(error)} aria-describedby={error ? "room-id-error" : "room-id-help"} />
        <small id="room-id-help" className="room-entry-help">Puedes pegar el código o abrir directamente el enlace de la sala.</small>
        <button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Abriendo sala…" : "Entrar a la sala"} <span aria-hidden="true">→</span></button>
      </form>
      {error && <p id="room-id-error" className="form-error" role="alert">{error}</p>}
    </section>
  );
}
