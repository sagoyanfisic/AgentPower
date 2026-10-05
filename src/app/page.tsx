import Link from "next/link";
import RoomEntry from "./room-entry";

export default async function Home({ searchParams }: { searchParams: Promise<{ roomError?: string }> }) {
  const params = await searchParams;
  const initialRoomError = params.roomError === "not-found" ? "La sala no existe o el código es incorrecto." : undefined;

  return (
    <main className="shell landing-shell">
      <header className="topbar">
        <Link className="brand-lockup" href="/">
          <span className="brand-mark">A</span>
          <span><strong>AgentPower</strong><small>GDG Open · Certification Lab</small></span>
        </Link>
        <span className="public-context"><span className="public-context-dot" aria-hidden="true" />Preparación para certificaciones GCP</span>
      </header>

      <section className="landing-layout" aria-labelledby="landing-title">
        <div className="landing-copy">
          <div className="landing-label"><a href="https://gdg.community.dev/gdg-open/" target="_blank" rel="noreferrer">GDG Open ↗</a><span>AgentPower</span></div>
          <p className="kicker">Simulacros de certificación</p>
          <h1 id="landing-title">Entra a tu sala. Pon a prueba tu nivel.</h1>
          <p className="lead">Un espacio abierto para fortalecer tus habilidades cloud, conectar con la comunidad y practicar con propósito antes de tu certificación.</p>
          <div className="landing-proof"><span><b>01</b> Preguntas aleatorias</span><span><b>02</b> Resultado y contexto</span><span><b>03</b> Estadísticas por sala</span></div>
          <div className="practice-flow" aria-label="Cómo funciona AgentPower">
            <div className="flow-step"><span className="flow-marker">1</span><span><strong>Entra</strong><small>Usa tu Room ID</small></span></div>
            <span className="flow-line" aria-hidden="true" />
            <div className="flow-step"><span className="flow-marker">2</span><span><strong>Responde</strong><small>Practica con tiempo</small></span></div>
            <span className="flow-line" aria-hidden="true" />
            <div className="flow-step"><span className="flow-marker">3</span><span><strong>Aprende</strong><small>Revisa tu resultado</small></span></div>
          </div>
          <a className="community-link" href="https://gdg.community.dev/gdg-open/" target="_blank" rel="noreferrer"><span className="community-link-mark" aria-hidden="true">↗</span><span><strong>Conoce GDG Open</strong><small>Comunidad abierta para compartir y aprender sobre tecnología</small></span></a>
        </div>

        <RoomEntry initialError={initialRoomError} />
      </section>

      <section className="gdg-intro" aria-labelledby="gdg-intro-title">
        <div><p className="kicker">El espíritu GDG Open</p><h2 id="gdg-intro-title">Aprende nuevas habilidades. Conecta con otras personas. Comparte lo que sabes.</h2></div>
        <div className="gdg-pillars"><article><span className="pillar-mark blue" aria-hidden="true">+</span><strong>Aprende</strong><p>Practica conceptos cloud con preguntas y contexto para seguir avanzando.</p></article><article><span className="pillar-mark red" aria-hidden="true">↗</span><strong>Conecta</strong><p>Participa en salas de estudio creadas para aprender en comunidad.</p></article><article><span className="pillar-mark yellow" aria-hidden="true">●</span><strong>Comparte</strong><p>Convierte tus resultados y aprendizajes en conversaciones útiles.</p></article></div>
      </section>

      <section className="community-vision" aria-labelledby="community-title">
        <div className="community-vision-overlay" />
        <div className="community-gallery" aria-hidden="true"><span className="gallery-image gallery-image-two" /><span className="gallery-image gallery-image-three" /></div>
        <div className="community-vision-content">
          <p className="kicker">El espíritu detrás de la sala</p>
          <h2 id="community-title">Aprender juntos hace que el siguiente nivel se sienta posible.</h2>
          <div className="mission-grid">
            <article><span className="vision-label">Misión</span><p>Crear prácticas accesibles y útiles para que cada persona pueda prepararse, conversar y aprender de sus respuestas.</p></article>
            <article><span className="vision-label">Visión</span><p>Conectar a la comunidad tecnológica con experiencias de aprendizaje que conviertan la preparación en progreso compartido.</p></article>
          </div>
          <a className="community-button" href="https://gdg.community.dev/gdg-open/" target="_blank" rel="noreferrer">Visitar la comunidad GDG Open <span aria-hidden="true">↗</span></a>
        </div>
      </section>

      <footer>Una experiencia de práctica para comunidades que aprenden en Google Cloud.</footer>
    </main>
  );
}
