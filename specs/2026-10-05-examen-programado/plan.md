# Plan — examen programado por práctica

## Estado y alcance

- Estado: en curso
- Alcance autorizado: implementar salas de examen con ID, horario, duración, control de acceso por URL, finalización por tiempo y estadísticas aisladas por sala. La persona inicia el intento al confirmar nombre, apellidos y avatar; el servidor genera el identificador interno.
- Decisiones aplicadas: la URL con `roomId` es suficiente para este MVP; la ventana de acceso controla cuándo se puede entrar y la duración del examen es configurable entre 1 y 1440 minutos desde la confirmación del perfil; la administración puede cargar bancos JSON bilingües validados. La política editorial y de licencia de cada banco queda bajo responsabilidad de la administración.

## 1. Modelo de convocatoria y tiempo autoritativo

- [x] Definir el documento de sala: `roomId` público, certificación, nombre, estado, ventana `startsAt`/`endsAt`, zona horaria, duración configurable de 1 a 1440 minutos, banco seleccionado y versión del banco.
- [ ] Definir estados y transiciones: `scheduled` → `active` → `closed`, incluyendo cancelación administrativa si se confirma como necesaria.
- [ ] Definir los valores de sesión: `roomId`, identificador interno de participante, `startedAt`, `deadlineAt`, `finishedAt` y `finishedReason`.
- [ ] Definir normalización UTC, validación de intervalos y política ante cambios de horario después de que existan participantes.
- Verificación: tabla de casos de frontera para antes/durante/después de la ventana, duración vencida, cambio de zona horaria y reloj del cliente alterado.

## 2. Bancos JSON y certificaciones

- [ ] Definir el contrato JSON reutilizable para certificación, idioma, preguntas, opciones, respuesta correcta, explicación y fuente.
- [x] Añadir carga administrativa con límite de tamaño, parseo seguro, validación estructural y versión identificable del banco.
- [ ] Impedir que la carga oculte preguntas de otra versión y conservar la relación entre banco, certificación y práctica.
- [ ] Mostrar bancos disponibles y su estado de validación antes de crear una convocatoria.
- [ ] Permitir seleccionar un banco guardado o cargar y validar un JSON nuevo durante la creación de la sala.
- Verificación: cargar un JSON válido para otra certificación, rechazar JSON corrupto, IDs duplicados, campos ausentes, opciones inválidas, fuentes no HTTPS y archivos que excedan el límite.

## 3. Creación y gestión administrativa

- [x] Añadir flujo protegido para crear una sala, seleccionar el JSON asociado y mostrar la URL generada (`/room/:roomId`).
- [x] Añadir listado administrativo de salas con estado y fechas.
- [ ] Añadir detalle de una sala con ventana, duración, URL, banco usado y estado de uso.
- [ ] Generar el identificador interno de participante al confirmar el formulario y asociarlo de forma atómica a la sesión anónima y al `roomId`.
- [ ] Añadir eliminación confirmada de salas cerradas, sesiones y métricas asociadas, respetando bancos compartidos por otras salas.
- [ ] Definir endpoints autenticados, validación de payloads, rate limiting y respuestas sin datos personales innecesarios.
- Verificación: crear una práctica válida, rechazar fechas inválidas y comprobar que una persona no autenticada no puede crear ni listar convocatorias.

## 4. Ingreso y sesión participante

- [ ] Añadir ruta `/room/:roomId` que cargue la sala y su banco asociado en el servidor.
- [ ] Añadir pantalla de ingreso en la URL de sala para introducir nombre, apellidos y avatar; el `roomId` proviene de la URL.
- [ ] Iniciar el cronómetro únicamente después de que el servidor acepte el formulario y genere el identificador interno; abrir o recargar la sala no debe iniciar el intento.
- [ ] Resolver el estado de la práctica en el servidor y mostrar mensajes para ID ausente, inexistente, aún no activa y cerrada.
- [ ] Asociar la sesión anónima a sala y participante interno y mantener esa asociación durante recargas y cambios de idioma.
- [ ] Limitar el reinicio de la sesión anónima en la misma sala.
- [ ] Evitar que el cliente pueda cambiar `roomId`, `questionBankVersion`, `startedAt` o `deadlineAt` mediante un POST manipulado.
- Verificación: flujo completo con `roomId` válido, todos los errores de ingreso, generación interna, recarga y cookie reutilizada desde otro contexto.

## 5. Control de duración y finalización

- [ ] Mostrar cuenta regresiva basada en el límite calculado por servidor y refrescarla sin enviar una solicitud por cada segundo.
- [ ] Validar en cada guardado, avance y resultado que la práctica siga abierta y que la sesión no haya vencido.
- [ ] Implementar finalización idempotente por `completed`, `timeout` y `closed`.
- [ ] Garantizar que el último guardado válido no se duplique ni se pueda modificar después del límite.
- Verificación: pruebas con reloj controlado para respuesta antes del límite, exactamente en el límite, después del límite y después del cierre global; recarga durante la cuenta regresiva.

## 6. Estadísticas por ID de sala

- [ ] Crear claves e índices Redis con namespace por sala y retención definida.
- [ ] Registrar una sola vez cada resultado finalizado por sesión y práctica.
- [ ] Calcular por sala participantes, finalizados, promedio, distribución de puntuación, preguntas con más fallos y temas prioritarios.
- [ ] Añadir el selector de sala al panel y evitar mezclar los agregados entre `roomId`.
- [ ] Añadir identificación de certificación y versión del banco al encabezado de estadísticas.
- [ ] Mostrar estados vacíos y métricas parciales para prácticas sin resultados o con sesiones todavía abiertas.
- Verificación: dos prácticas con respuestas diferentes, comprobación de aislamiento, repetición del endpoint de finalización y consulta administrativa autorizada/no autorizada.

## 7. Seguridad, UX y operación

- [ ] Revisar que el ID público no sea el identificador interno de Redis ni contenga timestamps o datos personales.
- [ ] Mantener `no-store`, `noindex`, rate limiting y validación de sesión en todos los endpoints de práctica.
- [ ] Diseñar los estados de ingreso, espera, activo, tiempo por terminar y cerrado para móvil y accesibilidad.
- [ ] Añadir logs operativos sin nombres, respuestas, cookies ni secretos.
- [ ] Documentar variables de entorno, retención, limpieza y comportamiento esperado en Redis Cloud/Vercel.
- Verificación: revisión de seguridad, lint, tipos, pruebas de contenido, build Docker y recorrido manual móvil.

## Trazabilidad y continuidad

| Grupo | Requisitos | Verificación prevista |
| --- | --- | --- |
| 1 | REQ-001, REQ-002, REQ-003, REQ-005, REQ-006, REQ-007, REQ-008 | Casos temporales, esquema de sala validado y pruebas con reloj controlado |
| 2 | REQ-001A, REQ-001B, REQ-012 | Carga JSON válida/ inválida, versionado y selección de certificación |
| 3 | REQ-001, REQ-002, REQ-002A, REQ-011, REQ-011A, REQ-012 | Flujo administrativo autenticado, URL de sala, listado, eliminación y validación de payloads |
| 4 | REQ-004, REQ-004A, REQ-005, REQ-006A, REQ-012 | Ingreso por URL, formulario de perfil, generación interna, inicio del tiempo al confirmar, recarga y asociación de sesión |
| 5 | REQ-006, REQ-007, REQ-008, REQ-012 | Pruebas de límite, cierre global y finalización idempotente |
| 6 | REQ-009, REQ-010, REQ-011, REQ-011A | Dos prácticas aisladas, dashboard por ID, certificación y eliminación |
| 7 | REQ-002, REQ-004, REQ-012 | Revisión de seguridad, accesibilidad, móvil y despliegue |

- Siguiente acción: completar pruebas de frontera con reloj controlado y recorrido manual en móvil; después desplegar cuando se autorice.
- Bloqueo real, si existe: no hay bloqueo técnico. El límite de 1440 minutos es una restricción operativa del MVP y puede cambiarse en una decisión posterior.
