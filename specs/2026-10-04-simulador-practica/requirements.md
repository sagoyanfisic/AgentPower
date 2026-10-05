# Requisitos — simulador de práctica

## Objetivo y alcance

Permitir que una persona practique un conjunto versionado de preguntas de opción múltiple para la certificación Professional Cloud DevOps Engineer de Google Cloud, reciba una puntuación al terminar y entienda cada resultado mediante una explicación vinculada a documentación seleccionada.

La primera entrega será una experiencia web sin cuenta, con persistencia temporal de sesiones anónimas en Redis, sin sincronización de identidad entre dispositivos y sin generación dinámica de contenido.

## Requisitos verificables

- [REQ-001] La persona puede iniciar una sesión con un conjunto de preguntas disponible.
  - Dado: existe un banco de preguntas válido.
  - Cuando: la persona abre la aplicación e inicia la práctica.
  - Entonces: ve una pregunta, sus opciones de respuesta y un control para avanzar.

- [REQ-002] La persona puede responder cada pregunta y recorrer la sesión.
  - Dado: la persona está viendo una pregunta.
  - Cuando: selecciona una opción y avanza.
  - Entonces: la selección queda registrada para esa sesión y se muestra la siguiente pregunta hasta completar el conjunto.

- [REQ-003] La persona puede consultar su resultado final.
  - Dado: la persona completó todas las preguntas.
  - Cuando: finaliza la sesión.
  - Entonces: ve el número de respuestas correctas, el total de preguntas y el porcentaje o puntuación calculada de forma consistente.

- [REQ-004] La persona puede revisar el contexto de cada respuesta.
  - Dado: la persona está en el resultado final.
  - Cuando: revisa una pregunta.
  - Entonces: ve su respuesta, la respuesta correcta, una explicación breve y una referencia a la documentación seleccionada que fundamenta la explicación.

- [REQ-005] El banco de preguntas mantiene una estructura verificable y contenido separado de la interfaz.
  - Dado: se agrega o modifica una pregunta del banco versionado.
  - Cuando: se ejecutan las validaciones del proyecto.
  - Entonces: se detectan campos obligatorios ausentes, opciones inválidas, respuestas correctas inexistentes o referencias documentales faltantes antes del despliegue.

- [REQ-006] La persona puede registrar su nombre, apellidos y avatar antes de comenzar.
  - Dado: la persona ha elegido iniciar una práctica.
  - Cuando: completa nombre y apellidos, elige un avatar y confirma.
  - Entonces: la sesión comienza y muestra ese perfil durante la práctica y en el resultado final; los datos permanecen solo en el navegador local.

- [REQ-007] La interfaz comunica el estado de la práctica de forma accesible.
  - Dado: la persona está completando el perfil o una pregunta.
  - Cuando: navega con teclado o usa un lector de pantalla.
      - Entonces: puede volver del perfil, identifica el progreso actual y total, distingue la opción seleccionada y encuentra un indicador de foco visible.

- [REQ-008] La persona puede continuar una sesión anónima después de recargar o cerrar y volver a abrir la aplicación.
  - Dado: la persona inició una sesión y respondió al menos una pregunta.
  - Cuando: recarga la página o vuelve a abrir la aplicación en el mismo navegador.
  - Entonces: una cookie de sesión permite recuperar desde Redis el perfil, la pregunta actual y las respuestas registradas; si la sesión estaba finalizada, se recupera el resultado mientras el TTL siga vigente.

- [REQ-009] La respuesta correcta y el contexto documental no se exponen durante la práctica.
  - Dado: la persona está respondiendo preguntas.
  - Cuando: inspecciona la interfaz o el estado de la sesión antes de finalizar.
  - Entonces: el cliente recibe solo el enunciado y las opciones; la corrección y explicación se calculan en el servidor al solicitar el resultado.

- [REQ-010] La aplicación limita el acceso automatizado a sus endpoints de práctica.
  - Dado: una persona o agente realiza solicitudes repetidas al sitio.
  - Cuando: solicita preguntas o resultados sin una sesión válida o supera el límite temporal.
  - Entonces: el servidor rechaza la petición, aplica una respuesta `429` cuando corresponde y no entrega contenido sin sesión.

- [REQ-011] La sesión anónima se vincula temporalmente al contexto de acceso que la creó.
  - Dado: existe una sesión activa en Redis.
  - Cuando: la cookie se reutiliza desde otra combinación de IP y agente de usuario.
  - Entonces: el servidor rechaza la sesión sin revelar su contenido.

- [REQ-012] Una persona administradora puede consultar las sesiones activas desde un panel protegido.
  - Dado: existen sesiones con actividad reciente.
  - Cuando: la administración accede con la clave configurada.
      - Entonces: ve nombre, avatar, última actividad y estado de visibilidad de pestaña sin ver respuestas ni datos de otras sesiones.

- [REQ-013] El panel administrativo ordena las sesiones por rendimiento actual.
  - Dado: existen varias sesiones con respuestas registradas.
  - Cuando: la administración consulta las conexiones.
  - Entonces: ve el puesto, los aciertos actuales, el avance respondido y las sesiones ordenadas por aciertos, avance y actividad reciente.

- [REQ-014] El panel administrativo recibe cambios de presencia en tiempo real.
  - Dado: el panel está autenticado y existe una conexión SSE activa.
  - Cuando: una sesión envía un heartbeat, se elimina o expira su presencia.
      - Entonces: el panel actualiza el listado mediante Redis Streams sin depender de una consulta periódica de la clasificación.

- [REQ-015] La persona puede practicar el banco en inglés o español.
  - Dado: existe una pregunta con contenido localizado.
  - Cuando: selecciona `EN` o `ES` en el selector de idioma.
      - Entonces: recibe en ese idioma el enunciado, las opciones, la respuesta final y la explicación; el avance y la selección se conservan.

- [REQ-016] El banco activo de preguntas se lee desde Redis.
  - Dado: el despliegue ha sembrado la clave versionada del banco.
  - Cuando: la aplicación sirve preguntas, valida respuestas o calcula resultados.
      - Entonces: consulta Redis como fuente activa y devuelve un error controlado si el banco no está disponible; el JSON versionado solo se usa para sembrar la clave.

- [REQ-017] La revisión del resultado está paginada.
  - Dado: la sesión tiene muchas preguntas y explicaciones.
  - Cuando: la persona abre el resultado final.
  - Entonces: ve el puntaje, una página acotada de sustentaciones y controles para avanzar o retroceder sin cargar las 100 revisiones en una sola vista.

- [REQ-018] Cada sesión recibe las preguntas en un orden aleatorio persistente.
  - Dado: se crea una sesión nueva para una persona.
  - Cuando: la aplicación entrega el banco de preguntas y la persona recarga o cambia el idioma.
      - Entonces: el orden de esa sesión se conserva, otra sesión recibe una permutación independiente y el resultado respeta el orden de la sesión.

- [REQ-019] La administración puede identificar necesidades de capacitación.
  - Dado: existen prácticas finalizadas.
  - Cuando: la administración consulta las métricas privadas.
      - Entonces: ve los temas con mayor proporción y cantidad de fallos, además de las preguntas con más respuestas incorrectas, sin datos personales ni respuestas de las personas.

## Fuera de alcance

- Registro, autenticación y sincronización del progreso entre dispositivos o navegadores.
- Edición de preguntas desde la aplicación.
- Generación de preguntas o explicaciones con IA en tiempo de ejecución.
- Preguntas reales, filtradas o confidenciales del examen oficial.
- Pagos, anuncios, ranking social público y modo adaptativo.

## Decisiones y contexto

- El contenido se almacenará como archivos versionados y será consumido por el cliente en el MVP.
- Cada explicación debe incluir una referencia documental revisable; la aplicación no presentará una explicación sin fuente.
- El alcance deriva de la misión del proyecto y de las decisiones DEC-003, DEC-004 y DEC-005.

## Riesgos pertinentes

- El contenido puede quedar desactualizado si cambia la documentación o el temario; las referencias deben revisarse junto con el banco.
- No se debe publicar material protegido, confidencial o presentado como pregunta oficial del examen.
- La puntuación y la selección de opciones son datos de sesión temporal; Redis no debe recibir secretos ni material distinto del perfil y progreso necesarios.
