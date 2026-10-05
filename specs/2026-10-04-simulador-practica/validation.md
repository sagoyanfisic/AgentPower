# Validación — simulador de práctica

## Criterios de aceptación

| Requisito | Comprobación o prueba | Resultado esperado | Estado |
| --- | --- | --- | --- |
| REQ-001 | `npm run build` y revisión de la página principal | Se genera la ruta estática con inicio de sesión | Verificado |
| REQ-002 | Revisión de `src/app/page.tsx` y `npm run typecheck` | Selección y navegación tipadas sin errores | Verificado |
| REQ-003 | Revisión de cálculo en `src/app/page.tsx` y build | Resultado calcula aciertos, total y porcentaje | Verificado |
| REQ-004 | Revisión de sección de resultados y build | Cada pregunta incluye explicación y fuente | Verificado |
| REQ-005 | `npm run validate:content` | Banco válido pasa; validador cubre campos y referencias | Verificado |
| REQ-006 | Flujo manual en navegador: iniciar, completar nombre/apellidos, elegir avatar y confirmar | El perfil aparece en la sesión de preguntas | Verificado |
| REQ-007 | Snapshot del navegador y `check_contrast.py` | Se anuncia botón de regreso, progressbar, radiogroup/radios y estados de foco con contraste AA | Verificado |
| REQ-008 | API Redis, cookie anónima, recarga y snapshot del estado recuperado | Se mantienen perfil, pregunta actual y respuesta elegida mientras la sesión Redis siga vigente | Verificado |
| REQ-009 | `curl /api/questions`, `POST /api/session/result` y revisión del bundle cliente | El payload de práctica solo contiene preguntas/opciones; la corrección y explicación aparecen después del resultado servidor | Verificado |
| REQ-010 | Solicitud sin cookie, solicitud con cookie y revisión de `robots.txt`/headers | Sin cookie devuelve `401`; una sesión válida devuelve `200`; la app es `noindex` y las respuestas usan `no-store` | Verificado |
| REQ-012 | Heartbeat Docker, autenticación de `/api/presence/auth`, consulta con cookie y consulta sin autenticación | Redis recibe la presencia temporal; el panel devuelve nombre/avatar/estado; sin cookie administrativa devuelve `401` | Verificado |
| REQ-013 | Consulta autenticada con varias presencias y respuestas registradas | La respuesta devuelve puesto, aciertos, avance y ordena por aciertos, respuestas contestadas y actividad reciente | Verificado |
| REQ-014 | Snapshot SSE autenticado y `XADD` de un evento nuevo en Redis Stream | El panel recibe el snapshot inicial y el evento `presence` sin esperar polling; el timeout del stream permite resincronizar expiraciones | Verificado |
| REQ-015 | `GET /api/questions?lang=en|es`, selector EN/ES y resultado con idioma solicitado | Ambas variantes entregan 100 preguntas y el resultado usa el idioma elegido sin reiniciar respuestas | Verificado |
| REQ-016 | Borrado de `exam-gcp:question-bank:v1`, reinicio de `app` y consulta de `/api/questions?lang=en` | Docker vuelve a sembrar la clave con 100 preguntas; el endpoint responde 100 preguntas desde Redis | El JSON permanece dentro de la imagen únicamente como artefacto de seeding |
| REQ-017 | Revisión de `src/app/page.tsx`, `npm run typecheck`, `npm run lint` y build | El resultado conserva el puntaje arriba y muestra cinco explicaciones por página con navegación anterior/siguiente | La verificación de interacción completa requiere finalizar una sesión desde el navegador |
| REQ-011 | Cookie creada con `Browser-A/1` y lectura con `Browser-B/2` | La sesión anterior se rechaza por cambio de contexto y se expira la cookie | En pruebas se debe iniciar una sesión nueva; no hay recuperación de cookies antiguas |
| REQ-018 | Dos sesiones Docker independientes, dos lecturas para la primera sesión y comparación de IDs | Ambas sesiones reciben 100 IDs únicos; sus órdenes son distintos y el primer orden permanece igual al recargar | La aleatoriedad se verifica sobre dos muestras independientes |
| REQ-019 | Finalización de una práctica, autenticación administrativa y `GET /api/presence/stats` | El panel recibe métricas agregadas por tema y pregunta; una misma sesión no se cuenta dos veces; no se incluyen nombres ni respuestas | Las métricas permanecen mientras vivan las claves agregadas de Redis |

## Evidencia de ejecución

| Fecha | Comando o procedimiento | Resultado observado | Limitaciones |
| --- | --- | --- | --- |
| 2026-10-05 | `npm run validate:content` | Banco válido: 100 preguntas; cada enunciado, opción y explicación incluye `en` y `es` | Valida estructura, ambos idiomas y referencias HTTPS |
| 2026-10-04 | `npm run typecheck` | Correcto | No ejecuta interacción del navegador |
| 2026-10-04 | `npm run lint` | Correcto | No sustituye revisión funcional |
| 2026-10-04 | `npm run build` | Correcto con webpack; genera `/` estática | Turbopack falló por restricción de procesos del entorno |
| 2026-10-04 | `npm audit --omit=dev --audit-level=high` | 0 vulnerabilidades de producción | La cadena de ESLint mantiene 5 avisos altos de desarrollo |
| 2026-10-04 | Revisión SDD de seguridad y `basic_scan.py` sobre `src` y `scripts` | Sin secretos ni patrones de riesgo en el código revisado | No sustituye una auditoría de dependencias de desarrollo |
| 2026-10-04 | Navegador integrado: `http://127.0.0.1:3000` | Formulario y perfil `🦊 Ana Garcia` visibles en la pregunta 1 | Prueba manual; servidor local activo durante la verificación |
| 2026-10-04 | Navegador integrado: snapshot tras `requestSubmit()` | Progreso como `progressbar`, opciones como `radio` y botón `Siguiente` bloqueado sin selección | Prueba manual; no sustituye una auditoría con lector de pantalla real |
| 2026-10-04 | `orca reload` + captura visual de `http://127.0.0.1:3000` | Portada con contraste alto, CTA destacado, contador visible y composición con tarjetas redondeadas | Evidencia visual en navegador local; requiere revisar también viewport móvil |
| 2026-10-04 | Navegador integrado: selección de respuesta, `location.reload()` y lectura de `aria-checked` | Se recuperó `Ana Garcia`, avatar 🦊, pregunta 2 de 2 y la opción seleccionada después de recargar; una sesión finalizada recuperó la pantalla de resultado | Persistencia limitada al mismo navegador y origen |
| 2026-10-04 | `docker compose up -d --build`, `curl` GET/POST a `/api/session` | Redis y la app quedaron saludables; la API emitió cookie HttpOnly, aceptó el JSON validado y devolvió la sesión guardada | Requiere Redis administrado compatible y `REDIS_URL` en producción |
| 2026-10-04 | `curl /api/questions`, `POST /api/session/result` y `rg` sobre `.next/static/chunks` | Las preguntas públicas no incluyen `correctOption`, explicación ni fuente; el bundle cliente tampoco contiene esos valores; el endpoint servidor calculó `1/2` y devolvió el contexto solo al finalizar | El resultado final necesariamente contiene la respuesta correcta para poder revisarla |
| 2026-10-04 | Docker final: `curl /api/questions` sin cookie y con cookie | Sin cookie: `401`; con cookie emitida por `/api/session`: `200` | Rate limit depende de Redis y de los headers de IP del proveedor |
| 2026-10-04 | Revisión de `session-id.ts` y cookie Docker | La sesión usa token opaco base64url de 32 bytes, sin timestamp; Redis recibe únicamente SHA-256 del token | El token activo sigue siendo necesario para continuar la sesión |
| 2026-10-04 | Docker: sesión creada con `PracticeBrowser/1` y lectura con `DifferentBrowser/9` | La sesión vinculada fue rechazada con `403` | Cambios legítimos de red o navegador requieren una nueva sesión |
| 2026-10-05 | `docker compose up -d --build`; login en `/api/presence/auth`; heartbeat y GET `/api/presence` | Login: `200` con cookie HttpOnly; Redis contiene hash de la clave; consulta autenticada devuelve conexión con nombre/avatar/estado; consulta sin cookie: `401` | El punto rojo solo indica pestaña oculta o ventana sin foco; no demuestra qué pantalla está viendo la persona |
| 2026-10-05 | Docker: sesión `Ranking Test` con una respuesta correcta, heartbeat y GET administrativo | La respuesta devolvió `rank: 1`, `score: 1`, `answered: 1`, `total: 2`; otra sesión con menor progreso quedó en `rank: 2` | El ranking es privado del panel administrativo y representa progreso actual, no un ranking social público |
| 2026-10-05 | Docker: `GET /api/presence/stream` autenticado y `XADD presence-events` | SSE entregó `event: snapshot` y luego `event: presence` con el evento nuevo; Redis reportó `TYPE stream` y longitud creciente | La conexión SSE debe cerrarse y reabrirse si el proveedor termina una función serverless; el cliente EventSource reconecta automáticamente |
| 2026-10-05 | `npm run validate:content`, `npm run typecheck`, `npm run lint`, `npm run build` y revisión de `GET /api/questions?lang=en|es` | El banco original contiene 100 preguntas; la API entrega el texto público en el idioma solicitado y el resultado conserva ese idioma | La traducción local se genera al versionar el contenido; debe revisarse editorialmente antes de publicar cambios posteriores |
| 2026-10-05 | Revisión CSS responsive y `docker compose up -d --build` | En viewport móvil el selector de idioma permanece visible y el botón de siguiente pregunta queda fijo en la zona inferior, con espacio reservado para no cubrir las opciones | El botón fijo depende del navegador para respetar el área segura inferior del dispositivo |
| 2026-10-05 | `redis-cli del exam-gcp:question-bank:v1`, `docker compose restart app` y lectura de `/api/questions?lang=en` | La entrada se recreó con 100 preguntas y la API respondió `language: en`, `count: 100` | La prueba usa el Redis local de Docker |
| 2026-10-05 | `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` y `docker compose up -d --build` | La vista de resultado quedó paginada en grupos de cinco revisiones y el contenedor arrancó correctamente | No se ejecutó una finalización de 100 respuestas mediante navegador automatizado |
| 2026-10-05 | Cookie de sesión con dos agentes de usuario distintos contra `GET /api/session` | El contexto distinto no recibió el contenido de la sesión anterior y obtuvo una cookie de reemplazo automáticamente | Se conserva el binding como control de acceso; se evita que una cookie obsoleta bloquee la interfaz |
| 2026-10-05 | Revisión del efecto de persistencia en `src/app/page.tsx`, `npm run typecheck`, `npm run lint` y build Docker | Escribir nombre o apellidos no envía sesiones; el guardado empieza al confirmar el perfil y los cambios posteriores se agrupan con debounce de 350 ms | El heartbeat de presencia sigue siendo independiente y periódico |
| 2026-10-05 | Cookie arbitraria contra `/api/questions`, sesión nueva contra `/api/questions` y resultado completo contra `/api/session/result` | Cookie falsa: `401`; sesión válida: `200` con 100 preguntas; resultado: `score`/`total` sobre 100 pero solo 5 `items`, `pageCount: 20` | El cálculo completo permanece en servidor y la revisión se entrega por páginas |
| 2026-10-05 | Docker: dos sesiones con agentes `random-test-a/1` y `random-test-b/1`; dos lecturas de preguntas para la primera | Ambas devolvieron 100 preguntas únicas; los primeros IDs fueron distintos entre sesiones y `sameAfterReload: true` | La comprobación compara dos órdenes aleatorios concretos |
| 2026-10-05 | Docker: limpieza de métricas sintéticas, práctica completa de `stats-final/1`, autenticación administrativa y consulta de `/api/presence/stats` | La finalización registró 100 intentos y 77 fallos; el endpoint devolvió 8 temas y 100 preguntas con porcentajes; la suma de intentos por tema fue 100 y la respuesta `200` | La muestra usa respuestas sintéticas para validar el agregado |
| 2026-10-05 | `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`, escaneo de `src`/`scripts` y pruebas del harness | Sin errores de compilación, lint ni patrones de riesgo; 9 pruebas del harness aprobadas | `npm audit` no pudo consultar el registro por fallo DNS de `registry.npmjs.org` |

## Alcance de la evidencia

- Rama y commit, si existe: `main`, repositorio sin commits.
- Archivos revisados (incluidos nuevos, preparados o eliminados): especificación de esta funcionalidad y archivos raíz de `specs/`.
- Hashes pertinentes o referencia inmutable disponible: no hay commit; se revisará al implementar.
- Entorno y dependencias relevantes: Node 20.19.4, npm 10.8.2, Next.js 16.3.8, React 19.2.8.
- Cambios posteriores que exigen revalidar: cualquier cambio en el banco, la lógica de puntuación, la interfaz o los comandos de CI.

## Hallazgos

| Hallazgo | Severidad | Evidencia | Estado y comprobación de la corrección |
| --- | --- | --- | --- |
| Vulnerabilidades transitivas en la cadena de ESLint | Alta en dependencias de desarrollo | `npm audit` reporta `braces` a través de `eslint-config-next`; la corrección automática propone una degradación incompatible | Pendiente; no afecta dependencias de producción, requiere resolver una versión compatible antes de integrar |

## Antes de integrar

- [x] Criterios verificados con evidencia vigente (`$sdd-test`)
- [ ] Revisión de seguridad sin hallazgos altos/críticos pendientes (`$sdd-security-review`)
- [x] Plan y `specs/state.md` actualizados
