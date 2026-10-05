# Requisitos — examen programado por práctica

## Objetivo y alcance

Permitir que una persona administradora cree una sala de examen a partir de un banco JSON guardado o de un JSON nuevo, con un identificador generado, una ventana de acceso y una duración definida por la administración. La ventana de acceso determina cuándo se permite entrar; la duración del examen inicia cuando cada persona confirma su perfil y puede ser de 1 a 1440 minutos. Las personas participantes ingresan a la URL de la sala sin escribir un ID; la aplicación valida el horario en el servidor, controla el tiempo de la sesión y separa las métricas por sala.

La funcionalidad reutiliza el banco bilingüe, las sesiones anónimas, el perfil con nombre/avatar y el panel administrativo existente. El ID de la sala identifica la convocatoria y su URL; la cookie anónima continúa identificando la sesión individual dentro de ella. La administración podrá guardar bancos JSON validados para distintas certificaciones y asociar cada sala con un banco concreto.

## Requisitos verificables

- [REQ-001] La administración puede crear una sala de examen programada.
  - Dado: la administración está autenticada.
  - Cuando: selecciona un banco JSON guardado o carga uno nuevo, introduce certificación, nombre de la sala, fecha y hora de inicio, fecha y hora de cierre y duración.
  - Entonces: el servidor usa `America/Lima` como zona horaria predeterminada, exige una duración entre 1 y 1440 minutos, valida la ventana de acceso y crea la sala en estado `scheduled` con un ID único.

- [REQ-001A] La administración puede cargar un banco JSON para una certificación.
  - Dado: la administración está autenticada.
  - Cuando: carga un JSON que identifica la certificación y contiene preguntas bilingües, opciones, respuesta correcta, explicación y fuente HTTPS.
  - Entonces: el servidor valida el esquema completo, rechaza IDs duplicados, opciones inválidas o fuentes faltantes, y guarda una versión identificable del banco para asociarla a nuevas prácticas.

- [REQ-001B] Una sala puede usar un banco guardado de una certificación distinta o uno recién cargado.
  - Dado: existe un banco JSON validado.
  - Cuando: la administración crea una sala y selecciona ese banco.
  - Entonces: la sala conserva la certificación, el identificador de banco y la versión exacta usada para sus preguntas y estadísticas.

- [REQ-002A] La sala tiene una URL propia asociada al banco seleccionado.
  - Dado: la administración creó una sala con un banco JSON.
  - Cuando: consulta o comparte la sala.
  - Entonces: la aplicación muestra una URL con el ID de sala, y el servidor resuelve ese ID al banco asociado sin aceptar que el cliente cambie el banco mediante parámetros de URL.

- [REQ-002] Cada práctica tiene un identificador de ingreso generado por el servidor.
  - Dado: una práctica fue creada.
  - Cuando: la administración consulta su detalle.
  - Entonces: ve un ID compartible, no contiene datos personales, no se repite entre prácticas activas y permite localizar únicamente esa convocatoria.

- [REQ-003] La práctica expresa su ciclo de vida según el horario configurado.
  - Dado: existe una práctica con inicio y cierre definidos.
  - Cuando: se consulta antes del inicio, durante la ventana o después del cierre.
  - Entonces: el estado observable es `scheduled`, `active` o `closed`, calculado con la hora del servidor y no con el reloj del navegador.

- [REQ-004] Una persona debe ingresar a una sala mediante su URL o `roomId`.
  - Dado: la persona visita la plataforma sin una práctica vinculada.
  - Cuando: intenta comenzar sin `roomId`, con un ID inexistente o con una sala fuera de horario.
  - Entonces: no puede entrar al cuestionario y recibe un mensaje claro indicando si falta el ID, no existe o no está disponible.

- [REQ-004A] El servidor genera internamente el identificador de la sesión participante.
  - Dado: la persona abrió una sala válida.
  - Cuando: la persona confirma su nombre, apellidos y avatar.
  - Entonces: el servidor genera un identificador opaco asociado a la sesión y a la sala; la persona no debe escribirlo ni conocerlo para comenzar.

- [REQ-005] El ID de sala queda asociado a la sesión anónima.
  - Dado: la persona abrió la URL de una sala activa.
  - Cuando: confirma su nombre, apellidos y avatar en el formulario de ingreso.
  - Entonces: el servidor crea la sesión, genera su identificador interno, guarda `roomId` y la versión del banco, y fija `startedAt` en ese momento; una recarga conserva esa asociación.

- [REQ-006] La sesión tiene un tiempo límite calculado en el servidor.
  - Dado: la sala define una duración entre 1 y 1440 minutos y la persona inicia dentro de la ventana de acceso.
  - Cuando: responde preguntas, recarga o vuelve a abrir la plataforma.
  - Entonces: ve el tiempo restante calculado a partir de `startedAt` y `deadlineAt`; el navegador no puede ampliar el plazo modificando su reloj o el estado local.

- [REQ-006A] Abrir la sala o completar el formulario no inicia el tiempo antes de confirmar el ingreso.
  - Dado: la persona abrió la URL pero todavía no confirmó el formulario.
  - Cuando: permanece en la pantalla de ingreso o recarga esa pantalla.
  - Entonces: no se consume tiempo de examen; el contador comienza únicamente después de que el servidor acepta el formulario completo y genera el identificador interno.

- [REQ-007] El vencimiento finaliza la práctica de forma controlada.
  - Dado: la hora actual supera el límite individual o la ventana global de la práctica.
  - Cuando: la persona intenta responder, avanzar o finalizar.
  - Entonces: el servidor bloquea nuevas respuestas, guarda el último estado válido y muestra el resultado con una indicación de finalización por tiempo.

- [REQ-008] La práctica puede cerrarse aunque queden sesiones abiertas.
  - Dado: se alcanzó el cierre global de la convocatoria.
  - Cuando: una sesión solicita preguntas, guarda respuestas o calcula resultado.
  - Entonces: el servidor aplica el cierre global y no permite continuar respondiendo después de la hora definida.

- [REQ-009] Las métricas se aíslan por ID de sala.
  - Dado: existen resultados finalizados de varias salas.
  - Cuando: la administración selecciona una sala.
  - Entonces: ve participantes finalizados, intentos, puntuación, fallos por pregunta y fallos agrupados por tema solo de ese ID; las métricas de otras salas no se mezclan.

- [REQ-010] El panel muestra métricas útiles para capacitación.
  - Dado: una práctica tiene resultados finalizados.
  - Cuando: la administración abre sus estadísticas.
  - Entonces: ve tasa de finalización, promedio de puntuación, distribución de puntuaciones, preguntas con más fallos y temas prioritarios, ordenados por cantidad y porcentaje de error.

- [REQ-011] El panel permite localizar prácticas por estado e intervalo.
  - Dado: existen prácticas programadas, activas y cerradas.
  - Cuando: la administración consulta el listado.
      - Entonces: puede filtrar por ID, estado y fecha, y abrir el detalle de una práctica sin consultar sesiones de otra convocatoria.

- [REQ-011A] La administración puede eliminar una práctica cerrada y sus estadísticas.
  - Dado: una práctica está cerrada y la administración está autenticada.
  - Cuando: confirma la eliminación desde el panel.
  - Entonces: se eliminan el banco asociado solo si no lo usa otra práctica, las sesiones y las métricas de esa práctica; la acción no afecta otras convocatorias.

- [REQ-012] La aplicación valida permisos y datos en el servidor.
  - Dado: una persona conoce o modifica un ID, fecha, duración o `roomId` enviado por el cliente.
  - Cuando: solicita crear, consultar, unirse, guardar o leer estadísticas.
  - Entonces: el servidor valida formato, autenticación administrativa, pertenencia de la sesión, ventana temporal y límites; no confía en el estado enviado por el navegador.

## Fuera de alcance

- Cuentas de usuario, contraseñas, recuperación de identidad o asignación individual de participantes.
- Invitaciones por correo, códigos únicos por persona o control de asistencia presencial.
- Supervisión audiovisual, bloqueo de otras aplicaciones, detección de pantallas externas o garantía contra colaboración.
- Pausas individuales, extensión manual del tiempo y reanudación desde otro navegador.
- Edición del banco de preguntas desde el panel.
- Comparación pública entre participantes o ranking visible para las personas participantes.
- Ejecución de varias versiones arbitrarias del banco hasta definir un mecanismo de versionado administrable.

## Decisiones y contexto

- El ingreso usa el `roomId` de la URL. El servidor crea un identificador interno al confirmar el perfil; el ID de sala puede compartirse y no funciona como una identidad individual.
- La zona horaria visible predeterminada será `America/Lima`; los instantes se almacenarán en UTC y la práctica conservará la zona horaria para mostrar fechas comprensibles en el panel y en la pantalla de ingreso.
- El ID público será corto, generado con aleatoriedad criptográfica y separado de la clave interna de Redis; no se usará un contador predecible.
- La sesión conservará `startedAt`, `deadlineAt`, `roomId`, un identificador interno de participante, `questionBankVersion` y `finishedReason` (`completed`, `timeout` o `closed`) junto con el progreso existente.
- Las estadísticas se guardarán con claves Redis bajo el espacio de la sala y permanecerán hasta que la administración elimine la sala; no incluirán nombre, apellido ni cookie.
- La creación, listado y estadísticas usarán la autenticación administrativa existente. El ingreso de participantes requiere la URL de sala, nombre, apellidos, avatar y la sesión anónima posterior.
- La persona tendrá un solo intento por sesión anónima y sala. El servidor rechazará reinicios mientras conserve esa sesión, pero sin una cuenta o código individual no puede impedir que la misma persona use otro navegador.
- Para ingresar, los datos mínimos serán `roomId`, nombre, apellidos y avatar; el servidor generará internamente el identificador de participante y la sesión anónima.
- No se generará ni se solicitará un `participantId` desde el panel. Un PIN adicional sería opcional para restringir el acceso a la sala, pero no identifica de forma individual a cada persona.

## Riesgos pertinentes

- Un `roomId` compartido permite que otras personas se incorporen a la convocatoria; si se necesita acceso restringido, habrá que añadir un PIN o códigos individuales.
- Redis Cloud y Vercel pueden ejecutar solicitudes en instantes distintos; la hora autoritativa debe ser UTC del servidor y las operaciones de guardar/finalizar deben ser idempotentes.
- Una caída durante el guardado puede dejar respuestas sin registrar cerca del límite; la API debe guardar cada respuesta con debounce y rechazar cambios posteriores al plazo.
- Las estadísticas históricas pueden cambiar si se reemplaza el banco; por eso cada práctica debe registrar la versión del banco que utilizó.
- Un JSON cargado desde el panel puede contener preguntas mal traducidas, material no autorizado o URLs peligrosas; la validación estructural no sustituye la revisión editorial, de licencia y de seguridad del contenido.
- El número de salas, participantes y eventos puede hacer costoso escanear Redis; el plan debe usar índices por estado/fecha y agregados por sala en lugar de reconstruir todo en cada consulta.
