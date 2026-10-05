"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Connection = { id: string; rank: number; name: string; avatar: string; visible: boolean; focused: boolean; score: number; answered: number; total: number; finished: boolean; lastSeen: string };
type ConnectionUpdate = Omit<Connection, "rank">;
type LearningQuestion = { id: string; question: string; topic: string; attempts: number; failures: number; failureRate: number };
type LearningTopic = { topic: string; attempts: number; failures: number; failureRate: number };
type LearningStats = { questions: LearningQuestion[]; topics: LearningTopic[]; totalAttempts: number; totalFailures: number; knownQuestions: number };
type RoomConnection = { id: string; rank: number; name: string; avatar: string; visible: boolean; focused: boolean; score: number; answered: number; total: number; finished: boolean; lastSeen: string };
type BankMeta = { bankId: string; name: string; certification: string; version: string; questionCount: number; createdAt: string };
type RoomSummary = { roomId: string; name: string; certification: string; bankId: string; bankVersion: string; startsAt: string; endsAt: string; durationMinutes: number; status: "scheduled" | "active" | "closed"; url?: string };
type AdminTab = "rooms" | "connections" | "learning";
const gcpCertifications = ["Cloud Digital Leader", "Associate Cloud Engineer", "Professional Cloud Architect", "Professional Cloud DevOps Engineer", "Professional Cloud Developer", "Professional Data Engineer", "Professional Cloud Security Engineer", "Professional Cloud Network Engineer", "Professional Machine Learning Engineer", "Professional Cloud Database Engineer", "Associate Data Practitioner", "Otra certificación"];
const CUSTOM_CERTIFICATION = "__custom__";

function rankConnections(items: ConnectionUpdate[]) {
  return [...items].sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0) || Number(b.answered ?? 0) - Number(a.answered ?? 0) || String(b.lastSeen).localeCompare(String(a.lastSeen))).map((connection, index) => ({ rank: index + 1, ...connection }));
}

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [message, setMessage] = useState("Introduce la clave de administración para consultar las sesiones.");
  const [authenticated, setAuthenticated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [learningStats, setLearningStats] = useState<LearningStats | null>(null);
  const [banks, setBanks] = useState<BankMeta[]>([]);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [roomStats, setRoomStats] = useState<LearningStats | null>(null);
  const [roomConnections, setRoomConnections] = useState<RoomConnection[]>([]);
  const [bankName, setBankName] = useState("");
  const [bankCertification, setBankCertification] = useState("");
  const [bankCertificationOther, setBankCertificationOther] = useState("");
  const [bankContent, setBankContent] = useState("");
  const [bankFileName, setBankFileName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomCertification, setRoomCertification] = useState("");
  const [roomCertificationOther, setRoomCertificationOther] = useState("");
  const [roomBankId, setRoomBankId] = useState("");
  const [roomStartsAt, setRoomStartsAt] = useState("");
  const [roomEndsAt, setRoomEndsAt] = useState("");
  const [roomDuration, setRoomDuration] = useState("30");
  const [managementMessage, setManagementMessage] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("rooms");

  const loadLearningStats = useCallback(async () => {
    const response = await fetch("/api/presence/stats", { cache: "no-store" });
    if (response.ok) setLearningStats(await response.json() as LearningStats);
  }, []);

  const loadCatalog = useCallback(async () => {
    const [bankResponse, roomResponse] = await Promise.all([fetch("/api/admin/banks", { cache: "no-store" }), fetch("/api/admin/rooms", { cache: "no-store" })]);
    if (!bankResponse.ok || !roomResponse.ok) return;
    const bankData = await bankResponse.json() as { banks: BankMeta[] };
    const roomData = await roomResponse.json() as { rooms: RoomSummary[] };
    setBanks(bankData.banks); setRooms(roomData.rooms);
    if (!roomBankId && bankData.banks[0]) setRoomBankId(bankData.banks[0].bankId);
  }, [roomBankId]);

  const loadRoomStats = useCallback(async (roomId: string) => {
    setSelectedRoomId(roomId);
    if (!roomId) { setRoomStats(null); setRoomConnections([]); return; }
    const [statsResponse, presenceResponse] = await Promise.all([fetch(`/api/presence/room-stats/${roomId}`, { cache: "no-store" }), fetch(`/api/presence/room/${roomId}`, { cache: "no-store" })]);
    if (statsResponse.ok) setRoomStats((await statsResponse.json() as { stats: LearningStats }).stats);
    if (presenceResponse.ok) setRoomConnections((await presenceResponse.json() as { connections: RoomConnection[] }).connections);
  }, []);

  const loadConnections = useCallback(async () => {
    if (!key) return;
    setRefreshing(true);
    try {
      const authResponse = await fetch("/api/presence/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
      if (!authResponse.ok) {
        setAuthenticated(false);
        setMessage(authResponse.status === 401 ? "Clave inválida o panel no configurado." : "No se pudo consultar la presencia.");
        return;
      }
      const response = await fetch("/api/presence", { cache: "no-store" });
      if (!response.ok) { setAuthenticated(false); setMessage("No se pudo consultar la presencia."); return; }
      const data: { connections: Connection[] } = await response.json();
      setConnections(data.connections);
      setAuthenticated(true);
      setLastUpdated(new Date().toISOString());
      setMessage(`${data.connections.length} conexión${data.connections.length === 1 ? "" : "es"} activa${data.connections.length === 1 ? "" : "s"}.`);
      await Promise.all([loadLearningStats(), loadCatalog()]);
    } catch {
      setMessage("No se pudo actualizar la clasificación.");
    } finally {
      setRefreshing(false);
    }
  }, [key, loadCatalog, loadLearningStats]);

  useEffect(() => {
    if (!key) return;
    window.sessionStorage.setItem("gcp-admin-key", key);
    const initialLoad = window.setTimeout(() => void loadConnections(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [key, loadConnections]);

  useEffect(() => {
    if (!authenticated) return;
    const source = new EventSource("/api/presence/stream");
    const updateTimestamp = () => setLastUpdated(new Date().toISOString());
    source.addEventListener("snapshot", (event) => {
      const data = JSON.parse((event as MessageEvent<string>).data) as { connections: Connection[] };
      setConnections(data.connections);
      setMessage(`${data.connections.length} conexión${data.connections.length === 1 ? "" : "es"} activa${data.connections.length === 1 ? "" : "s"}.`);
      updateTimestamp();
    });
    source.addEventListener("presence", (event) => {
      const data = JSON.parse((event as MessageEvent<string>).data) as { type: "upsert" | "delete"; id: string; connection?: ConnectionUpdate };
      setConnections((current) => {
        const next = data.type === "delete" ? current.filter((connection) => connection.id !== data.id) : [...current.filter((connection) => connection.id !== data.id), { id: data.id, ...data.connection } as ConnectionUpdate];
        return rankConnections(next);
      });
      void loadLearningStats();
      updateTimestamp();
    });
    source.onerror = () => setMessage("Reconectando la clasificación en vivo…");
    return () => source.close();
  }, [authenticated, loadLearningStats]);

  useEffect(() => {
    const savedKey = window.sessionStorage.getItem("gcp-admin-key");
    if (!savedKey) return;
    const restore = window.setTimeout(() => setKey(savedKey), 0);
    return () => window.clearTimeout(restore);
  }, []);

  function signOut() {
    window.sessionStorage.removeItem("gcp-admin-key");
    setKey("");
    setAuthenticated(false);
    setConnections([]);
    setLearningStats(null);
    setBanks([]); setRooms([]); setRoomStats(null); setRoomConnections([]); setSelectedRoomId("");
    setMessage("Introduce la clave de administración para consultar las sesiones.");
  }

  const podium = connections.slice(0, 3);
  const podiumOrder = podium.length === 3 ? [podium[1], podium[0], podium[2]] : podium;
  const remaining = connections.slice(3);
  const displayedStats = selectedRoomId && roomStats ? roomStats : learningStats;

  async function uploadBank(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setManagementMessage("");
    const certification = bankCertification === CUSTOM_CERTIFICATION ? bankCertificationOther : bankCertification;
    const response = await fetch("/api/admin/banks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: bankName, certification, content: bankContent }) });
    const data = await response.json() as { bank?: BankMeta; error?: string };
    if (!response.ok) { setManagementMessage(data.error ?? "No se pudo guardar el set de preguntas."); return; }
    setManagementMessage(`Set de preguntas guardado: ${data.bank?.name ?? "OK"}`); setBankName(""); setBankCertification(""); setBankCertificationOther(""); setBankContent(""); setBankFileName(""); await loadCatalog();
  }

  async function createRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setManagementMessage("");
    const certification = roomCertification === CUSTOM_CERTIFICATION ? roomCertificationOther : roomCertification;
    const response = await fetch("/api/admin/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: roomName, certification, bankId: roomBankId, startsAt: roomStartsAt ? new Date(roomStartsAt).toISOString() : "", endsAt: roomEndsAt ? new Date(roomEndsAt).toISOString() : "", durationMinutes: Number(roomDuration) }) });
    const data = await response.json() as { room?: RoomSummary & { url: string }; error?: string };
    if (!response.ok) { setManagementMessage(data.error ?? "No se pudo crear la sala."); return; }
    setManagementMessage(`Sala creada: ${window.location.origin}${data.room?.url ?? ""}`); setRoomName(""); setRoomCertification(""); setRoomCertificationOther(""); await loadCatalog();
  }

  async function deleteRoom(roomId: string) {
    const room = rooms.find((item) => item.roomId === roomId);
    if (!window.confirm(`¿Eliminar la sala ${roomId} y sus estadísticas?${room?.status === "active" ? " La sala está activa y los participantes perderán el acceso." : ""}`)) return;
    const response = await fetch(`/api/admin/rooms/${roomId}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({})) as { error?: string };
    setManagementMessage(response.ok ? "Sala eliminada." : data.error ?? "No se pudo eliminar la sala.");
    await loadCatalog();
  }

  async function deleteBank(bankId: string) {
    if (!window.confirm("¿Eliminar este set JSON? Solo se puede eliminar si ninguna sala lo usa.")) return;
    const response = await fetch(`/api/admin/banks/${bankId}`, { method: "DELETE" });
    const data = await response.json() as { error?: string };
    setManagementMessage(response.ok ? "Set de preguntas eliminado." : data.error ?? "No se pudo eliminar el set.");
    await loadCatalog();
  }

  return (
    <main className="shell admin-shell">
      <header className="topbar"><Link className="brand-lockup" href="/"><span className="brand-mark">A</span><span><strong>AgentPower</strong><small>GDG Open · Certification Lab</small></span></Link><span className="status-dot">Panel privado</span></header>
      <section className={`setup-card admin-card ${authenticated ? "admin-authenticated" : ""}`} aria-labelledby="admin-title">
        <div className="admin-heading"><div><p className="kicker">AgentPower · GDG Open</p><h1 id="admin-title">Centro de control</h1><p className="setup-lead">Gestiona salas, sets de preguntas y el avance de las personas en un solo lugar.</p></div><span className="admin-badge">ADMIN</span></div>
        {!authenticated ? (
          <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void loadConnections(); }}>
            <label suppressHydrationWarning>Clave de administración<input type="password" value={key} onChange={(event) => setKey(event.target.value)} autoComplete="current-password" placeholder="ADMIN_DASHBOARD_KEY" /></label>
            <button className="primary-button" type="submit" disabled={refreshing}>{refreshing ? "Validando…" : "Ver clasificación"}</button>
          </form>
        ) : (
          <div className="admin-toolbar"><span className="live-label"><span className="live-pulse" aria-hidden="true" /> Clasificación en vivo</span><button className="secondary-button" type="button" onClick={signOut}>Salir del panel</button></div>
        )}
        <p className="admin-message" aria-live="polite">{refreshing && authenticated ? "Actualizando clasificación…" : message}{lastUpdated && authenticated ? ` · ${new Date(lastUpdated).toLocaleTimeString("es-PE")}` : ""}</p>
        {authenticated && <><nav className="admin-nav" aria-label="Secciones del panel"><button type="button" className={activeTab === "rooms" ? "active" : ""} onClick={() => setActiveTab("rooms")}>Salas y sets</button><button type="button" className={activeTab === "connections" ? "active" : ""} onClick={() => setActiveTab("connections")}>Conexiones</button><button type="button" className={activeTab === "learning" ? "active" : ""} onClick={() => setActiveTab("learning")}>Capacitación</button></nav><div className="admin-overview" aria-label="Resumen del panel"><article><span className="overview-icon">◈</span><div><strong>{rooms.length}</strong><span>salas creadas</span></div></article><article><span className="overview-icon">▣</span><div><strong>{banks.length}</strong><span>sets disponibles</span></div></article><article><span className="overview-icon live">●</span><div><strong>{connections.length}</strong><span>conexiones activas</span></div></article></div></>}
        {authenticated && activeTab === "rooms" && <section className="room-admin" aria-labelledby="room-admin-title">
          <p className="kicker">Convocatorias</p><h2 id="room-admin-title">Salas y sets de preguntas</h2><p className="setup-lead">Configura primero el set y después la sala. La ventana de acceso define cuándo pueden entrar; la duración empieza cuando cada persona confirma su perfil.</p>
          <div className="room-admin-grid"><form onSubmit={(event) => void uploadBank(event)}><h3>Importar set JSON</h3><p className="field-help">Set bilingüe con preguntas, opciones, explicación y documentación.</p><label>Nombre del set<input value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="Ej. Simulacro DevOps 01" required /></label><label>Certificación<select value={bankCertification} onChange={(event) => setBankCertification(event.target.value)} required><option value="">Selecciona una certificación</option>{gcpCertifications.filter((certification) => certification !== "Otra certificación").map((certification) => <option key={certification} value={certification}>{certification}</option>)}<option value={CUSTOM_CERTIFICATION}>Otra certificación</option></select></label>{bankCertification === CUSTOM_CERTIFICATION && <label>Nombre de la certificación<input value={bankCertificationOther} onChange={(event) => setBankCertificationOther(event.target.value)} placeholder="Ej. Professional Cloud ..." required /></label>}<label>Archivo JSON<input type="file" accept=".json,application/json" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 2_000_000) { setManagementMessage("El archivo supera el límite de 2 MB."); return; } setBankFileName(file.name); void file.text().then(setBankContent); }} required={!bankContent} /></label>{bankFileName && <small className="file-name">Archivo seleccionado: {bankFileName}</small>}<label>O pega el JSON<textarea value={bankContent} onChange={(event) => { setBankContent(event.target.value); setBankFileName(""); }} rows={5} placeholder='[{"id":"...","question":{"en":"...","es":"..."}}]' /></label><button className="secondary-button" type="submit" disabled={!bankContent}>Importar set</button></form><form onSubmit={(event) => void createRoom(event)}><h3>Crear sala</h3><p className="field-help">El acceso se habilita solo dentro de la ventana indicada.</p><label>Nombre de la sala<input value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="Ej. Cohorte octubre" required /></label><label>Certificación<select value={roomCertification} onChange={(event) => setRoomCertification(event.target.value)} required><option value="">Selecciona una certificación</option>{gcpCertifications.filter((certification) => certification !== "Otra certificación").map((certification) => <option key={certification} value={certification}>{certification}</option>)}<option value={CUSTOM_CERTIFICATION}>Otra certificación</option></select></label>{roomCertification === CUSTOM_CERTIFICATION && <label>Nombre de la certificación<input value={roomCertificationOther} onChange={(event) => setRoomCertificationOther(event.target.value)} required /></label>}<label>Set de preguntas<select value={roomBankId} onChange={(event) => setRoomBankId(event.target.value)} required><option value="">Selecciona un set</option>{banks.map((bank) => <option key={bank.bankId} value={bank.bankId}>{bank.name} · {bank.questionCount} preguntas</option>)}</select></label><div className="date-grid"><label>Inicio de acceso<input type="datetime-local" value={roomStartsAt} onChange={(event) => setRoomStartsAt(event.target.value)} required /></label><label>Fin de acceso<input type="datetime-local" value={roomEndsAt} onChange={(event) => setRoomEndsAt(event.target.value)} required /></label></div><p className="field-help">La persona debe entrar entre estas fechas y horas.</p><label>Duración del examen (minutos)<input type="number" min={1} max={1440} value={roomDuration} onChange={(event) => setRoomDuration(event.target.value)} required /><span className="field-help">Empieza al confirmar el perfil. Puedes usar desde 1 hasta 1440 minutos.</span></label><button className="primary-button" type="submit">Crear sala</button></form></div>
          {managementMessage && <p className="admin-message" aria-live="polite">{managementMessage}</p>}
          <div className="room-list"><div className="list-heading"><div><p className="kicker">Gestión</p><h3>Salas creadas</h3></div><span>{rooms.length} total</span></div>{rooms.length === 0 ? <p className="stats-empty">Todavía no hay salas.</p> : rooms.map((room) => <article className="room-row" key={room.roomId}><div><strong>{room.name}</strong><small>{room.certification} · {room.roomId} · {room.durationMinutes} min</small><a href={`/room/${room.roomId}`} target="_blank" rel="noreferrer">Abrir sala ↗</a></div><span className={`room-status ${room.status}`}>{room.status}</span><button className="secondary-button" type="button" onClick={() => void loadRoomStats(room.roomId)}>Ver stats</button><button className="secondary-button danger-button" type="button" onClick={() => void deleteRoom(room.roomId)}>Eliminar</button></article>)}</div>
          <div className="room-list"><div className="list-heading"><div><p className="kicker">Contenido</p><h3>Sets de preguntas guardados</h3></div><span>{banks.length} total</span></div>{banks.length === 0 ? <p className="stats-empty">Todavía no hay sets.</p> : banks.map((bank) => <article className="room-row" key={bank.bankId}><div><strong>{bank.name}</strong><small>{bank.certification} · {bank.questionCount} preguntas · {bank.bankId}</small></div><button className="secondary-button danger-button" type="button" onClick={() => void deleteBank(bank.bankId)}>Eliminar set</button></article>)}</div>
          {selectedRoomId && roomStats && <div className="room-selected-stats"><div className="selected-room-heading"><div><p className="kicker">Análisis aislado</p><h3>Examen {selectedRoomId}</h3></div><span>{roomConnections.length} en vivo</span></div><div className="stats-grid"><article><strong>{roomStats.totalAttempts}</strong><span>respuestas registradas</span></article><article><strong>{roomStats.totalFailures}</strong><span>fallos</span></article><article><strong>{roomStats.questions.length}</strong><span>preguntas evaluadas</span></article></div>{roomConnections.length > 0 && <section className="room-live-panel" aria-label="Participantes en vivo"><div><p className="kicker">En vivo</p><h3>Quién está respondiendo</h3><div className="room-podium">{roomConnections.slice(0, 3).map((connection) => <article key={connection.id}><span>{connection.avatar}</span><strong>{connection.name}</strong><b>{connection.score}/{connection.total}</b></article>)}</div></div><div><p className="kicker">Actividad</p><h3>Nube de participantes</h3><div className="word-cloud">{roomConnections.map((connection) => <span key={connection.id} className={connection.visible && connection.focused ? "word-live" : "word-away"} style={{ fontSize: `${Math.max(13, Math.min(30, 13 + connection.answered * 1.5))}px` }}>{connection.avatar} {connection.name}</span>)}</div></div></section>}<div className="stats-columns"><div><h3>Temas</h3>{roomStats.topics.map((item) => <div className="stats-row" key={item.topic}><span><strong>{item.topic}</strong><small>{item.failures} fallos de {item.attempts}</small></span><b>{item.failureRate}%</b><span className="stats-bar"><i style={{ width: `${item.failureRate}%` }} /></span></div>)}</div><div><h3>Preguntas</h3>{roomStats.questions.slice(0, 5).map((item) => <div className="stats-row" key={item.id}><span><strong>{item.id}</strong><small>{item.question}</small></span><b>{item.failures}</b><span className="stats-bar"><i style={{ width: `${item.failureRate}%` }} /></span></div>)}</div></div></div>}
        </section>}
        {authenticated && activeTab === "connections" && (
          <div className="ranking-board" aria-live="polite" aria-label="Clasificación de conexiones">
            {connections.length === 0 ? <div className="empty-ranking">Aún no hay personas conectadas.</div> : (
              <>
                <div className="podium" aria-label="Tres primeros puestos">
                  {podiumOrder.map((connection) => <article className={`podium-card podium-${connection.rank}`} key={`${connection.id}-${connection.rank}-${connection.score}`}><span className="podium-rank">#{connection.rank}</span><span className="podium-avatar">{connection.avatar}</span><strong>{connection.name}</strong><span className="podium-score">{connection.score}/{connection.total}</span><span className={`presence-indicator ${connection.visible && connection.focused ? "active" : "away"}`} aria-label={connection.visible && connection.focused ? "Pestaña activa" : "Pestaña no visible o sin foco"} /><span className="podium-state">{connection.finished ? "Finalizado" : `${connection.answered} respondidas`}</span></article>)}
                </div>
                {remaining.length > 0 && <div className="connection-list" aria-label="Resto de participantes">
                  {remaining.map((connection) => <article className="connection-row" key={`${connection.id}-${connection.rank}-${connection.score}`}><span className="connection-rank">#{connection.rank}</span><span className={`presence-indicator ${connection.visible && connection.focused ? "active" : "away"}`} aria-label={connection.visible && connection.focused ? "Pestaña activa" : "Pestaña no visible o sin foco"} /><span className="connection-avatar">{connection.avatar}</span><span className="connection-name">{connection.name}</span><span className="connection-score">{connection.score}/{connection.total} · {connection.answered} respondidas{connection.finished ? " · Finalizado" : ""}</span><span className="connection-state">{connection.visible && connection.focused ? "Activo" : "Pestaña oculta"}</span><time dateTime={connection.lastSeen}>{new Date(connection.lastSeen).toLocaleTimeString("es-PE")}</time></article>)}
                </div>}
              </>
            )}
          </div>
        )}
        {authenticated && activeTab === "learning" && displayedStats && <section className="learning-stats" aria-labelledby="learning-stats-title">
          <div className="stats-heading"><div><p className="kicker">Plan de capacitación</p><h2 id="learning-stats-title">Dónde están fallando</h2></div><div className="stats-filter"><label htmlFor="stats-room">Examen</label><select id="stats-room" value={selectedRoomId} onChange={(event) => void loadRoomStats(event.target.value)}><option value="">Todas las salas / set activo</option>{rooms.map((room) => <option key={room.roomId} value={room.roomId}>{room.name} · {room.roomId}</option>)}</select></div></div>
          <p className="stats-scope">{selectedRoomId ? `Mostrando únicamente resultados de ${selectedRoomId}` : "Vista global del set activo"}</p>
          {displayedStats.totalAttempts === 0 ? <p className="stats-empty">Aún no hay sesiones finalizadas para generar métricas.</p> : <>
            <div className="stats-grid"><article><strong>{displayedStats.totalFailures}</strong><span>fallos registrados</span></article><article><strong>{Math.round((displayedStats.totalFailures / displayedStats.totalAttempts) * 100)}%</strong><span>error global</span></article><article><strong>{displayedStats.questions.length}</strong><span>preguntas practicadas</span></article></div>
            <div className="stats-columns"><div><h3>Temas prioritarios</h3><div className="stats-list">{displayedStats.topics.map((item) => <div className="stats-row" key={item.topic}><span><strong>{item.topic}</strong><small>{item.failures} fallos de {item.attempts} respuestas</small></span><b>{item.failureRate}%</b><span className="stats-bar"><i style={{ width: `${item.failureRate}%` }} /></span></div>)}</div></div><div><h3>Preguntas con más fallos</h3><div className="stats-list">{displayedStats.questions.slice(0, 10).map((item) => <div className="stats-row" key={item.id}><span><strong>{item.id}</strong><small>{item.question}</small></span><b>{item.failures}</b><span className="stats-bar"><i style={{ width: `${item.failureRate}%` }} /></span></div>)}</div></div></div>
          </>}
        </section>}
      </section>
    </main>
  );
}
