# Validación — examen programado por práctica

## Criterios de aceptación

| Requisito | Comprobación o prueba | Resultado esperado | Estado |
| --- | --- | --- | --- |
| REQ-001 | Crear sala desde el panel con duración válida e inválida | Se genera una sala con duración entre 1 y 1440 minutos y se rechazan valores fuera de rango | Parcial: API probado con 30 min; rango actualizado y validado por código |
| REQ-001A | Cargar un JSON válido y un payload inválido | Se crea una versión de banco y se rechaza el esquema incorrecto | Ejecutado: carga de 100 preguntas devolvió 201 |
| REQ-001B | Asociar una sala a un banco | La sala conserva certificación y versión del banco | Ejecutado: la sesión cargó 100 preguntas del banco asociado |
| REQ-002A | Abrir una sala y consultar preguntas | El servidor resuelve el `roomId` al banco asociado | Ejecutado: endpoint devolvió el banco de la sala |
| REQ-002 | Crear una sala y revisar su ID | El ID es único, opaco y no contiene datos personales | Ejecutado: ID `ROOM-` hexadecimal de 12 caracteres |
| REQ-003 | Consultar una sala activa | El estado se calcula con hora UTC del servidor | Ejecutado para estado `active`; frontera completa pendiente |
| REQ-004 | Abrir una sala válida sin cookie | Se muestra el formulario y no el cuestionario | Ejecutado: GET devolvió `session: null` |
| REQ-004A | Confirmar el formulario | El servidor genera el identificador interno sin pedirlo al participante | Ejecutado: POST creó sesión; el campo interno no se devuelve |
| REQ-005 | Iniciar, recargar y cambiar idioma | La sesión conserva sala, versión y progreso | Parcial: sesión y cambio de idioma cubiertos por API/UI; recorrido manual pendiente |
| REQ-006 | Enviar fechas manipuladas | El servidor conserva `startedAt` y `deadlineAt` autoritativos | Ejecutado por validación de modelo y POST de progreso |
| REQ-006A | Abrir la sala antes de confirmar el perfil | El tiempo inicia al aceptar el formulario en el servidor | Ejecutado: `session` fue nula antes del perfil y `startedAt` se creó al POST |
| REQ-007 | Guardar respuestas y finalizar | Se calcula resultado paginado y se registra el motivo | Ejecutado: 100 respuestas, resultado 26/100 y 5 elementos por página |
| REQ-008 | Repetir finalización | El resultado permanece idempotente | Ejecutado en API de resultado; prueba de cierre global pendiente |
| REQ-009 | Consultar estadísticas de una sala | Los agregados quedan bajo el ID de la sala | Ejecutado: 100 intentos y 8 temas en estadísticas aisladas |
| REQ-010 | Consultar estadísticas con resultados | Se muestran promedio, fallos por pregunta y temas prioritarios | Ejecutado: respuesta de estadísticas incluyó 100 preguntas y 8 temas |
| REQ-011 | Listar salas desde administración | La administración ve salas con estado y fechas | Ejecutado en API administrativa durante prueba E2E |
| REQ-011A | Eliminar una sala cerrada | Se eliminan sesiones y métricas sin tocar otros bancos | Implementado; recorrido de borrado pendiente |
| REQ-012 | Llamar endpoints sin permisos o con payload inválido | El servidor rechaza acceso y valores fuera de límites | Ejecutado parcialmente: 401/403 y validaciones principales; matriz completa pendiente |

## Evidencia de ejecución

| Fecha | Comando o procedimiento | Resultado observado | Limitaciones |
| --- | --- | --- | --- |
| 2026-10-05 | `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` | Todos pasaron; el build incluyó las rutas de salas y administración | Verificación estática y de contenido |
| 2026-10-05 | Flujo E2E API con Redis local: autenticar admin, cargar banco, crear sala, iniciar perfil, leer preguntas, guardar 100 respuestas, obtener resultado y estadísticas | 200/201 en flujo válido; resultado 26/100 paginado en 5 elementos; estadísticas aisladas con 100 intentos y 8 temas | Se usó un participante sintético; no cubre interacción visual móvil |
| 2026-10-05 | `python3 scripts/check_harness.py` | `PASS: 15 skills; structure, invocations and local links checked.` | Comprueba el harness, no la aplicación |
| 2026-10-05 | `npm audit --omit=dev --audit-level=high` | No pudo consultar npm por DNS (`ENOTFOUND registry.npmjs.org`) | Repetir con acceso a red antes de integrar |
| 2026-10-05 | Revisión y corrección de seguridad: rutas globales, administración, body JSON, Redis y sala | Las rutas heredadas responden `410`; las rutas administrativas aplican límite de intentos; los bodies se leen con máximo de 5 MB; Compose exige secretos, autentica Redis y lo publica solo en localhost; una sala entrega una pregunta por solicitud y bloquea un segundo intento con la misma vinculación | Verificado con `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` y `docker compose --env-file /tmp/exam-gcp-review.env config`; el build de la imagen Docker terminó correctamente |
| 2026-10-05 | `docker compose --env-file /tmp/exam-gcp-review.env up -d --build`, `curl /api/session`, `curl /api/questions`, `curl /api/admin/rooms`, `redis-cli` sin/con contraseña | Las rutas globales respondieron `410`, administración sin clave respondió `401`, Redis sin clave respondió `NOAUTH Authentication required` y con la clave de prueba respondió `PONG` | La validación usó secretos temporales fuera del repositorio y el contenedor quedó levantado para pruebas locales |

## Alcance de la evidencia

- Rama y commit, si existe: `main`, repositorio sin commits.
- Archivos revisados (incluidos nuevos, preparados o eliminados): `specs/state.md`, `specs/mission.md`, `specs/tech-stack.md`, `specs/roadmap.md`, `docs/harness.md`, `specs/decisions.md` y el código actual de sesiones, presencia, resultados y estadísticas.
- Hashes pertinentes o referencia inmutable disponible: no hay commit; evidencia asociada al árbol de trabajo del 2026-10-05.
- Entorno y dependencias relevantes: Next.js + TypeScript, Route Handlers y Redis con Docker Compose/Redis Cloud compatible.
- Cambios posteriores que exigen revalidar: cualquier cambio en el modelo de sesión, claves Redis, autenticación administrativa, reloj de servidor, banco de preguntas o cálculo de resultados.

## Hallazgos

| Hallazgo | Severidad | Evidencia | Estado y comprobación de la corrección |
| --- | --- | --- | --- |
| El recorrido visual móvil y las fronteras exactas del reloj aún no tienen evidencia automatizada | Media | La prueba E2E cubre el flujo HTTP y el build; no controla el reloj ni un navegador móvil | Pendiente de recorrido manual |
| `npm audit` no pudo consultar el registro por falta de DNS | Media | El comando terminó con `ENOTFOUND registry.npmjs.org` | Pendiente de repetir con red disponible |
| Con solo cookie anónima no se puede garantizar un solo intento al cambiar de navegador | Media | El MVP no tiene identidad de participante | Aceptado para este alcance; el sistema limita la sesión actual y puede añadirse PIN o identidad individual después |

## Antes de integrar

- [x] Criterios principales verificados con evidencia vigente (`$sdd-test`); quedan fronteras de reloj y recorrido móvil
- [x] Revisión de seguridad aplicada al código; no quedan hallazgos altos/críticos conocidos en esta revisión
- [x] Plan y `specs/state.md` actualizados
