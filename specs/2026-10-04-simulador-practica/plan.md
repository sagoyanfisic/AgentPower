# Plan — simulador de práctica

## Estado y alcance

- Estado: en curso
- Alcance autorizado: implementar el MVP de práctica sin cuenta, con preguntas versionadas, puntuación final y explicación documentada por respuesta.
- Decisiones pendientes: selección inicial y revisión editorial de las fuentes documentales; cantidad inicial de preguntas.

## 1. Modelo y banco de preguntas

- [x] Crear el esquema tipado del contenido y un banco inicial de preguntas de muestra.
- [x] Incluir respuesta correcta, explicación y referencia documental en cada entrada.
- [x] Añadir validación que rechace estructuras incompletas o inconsistentes.
- Verificación: validación automatizada del banco y revisión de una muestra de contenido.

## 2. Sesión de práctica

- [x] Implementar inicio, navegación, selección de respuesta y estado de sesión.
- [x] Permitir completar el conjunto sin perder la selección registrada.
- Verificación: prueba de interacción que cubra inicio, respuesta, avance y finalización.

## 3. Resultados y contexto documental

- [x] Calcular y mostrar aciertos, total y puntuación.
- [x] Mostrar el detalle de cada pregunta con respuesta elegida, respuesta correcta, explicación y fuente.
- [x] Cubrir estados de finalización y revisión sin requerir una cuenta.
- Verificación: prueba de resultado con respuestas correctas, incorrectas y revisión de referencias.

## 4. Calidad y entrega

- [x] Configurar los comandos reales de desarrollo, pruebas, lint, tipos y build.
- [x] Ejecutar validaciones locales y configurar GitHub Actions para las comprobaciones del proyecto.
- [x] Generar banco original de 100 preguntas con contenido localizado `en`/`es`, selector persistente y API pública por idioma.
- [x] Sembrar el banco versionado en Redis al iniciar Docker y leerlo desde Redis en las APIs de preguntas, sesión, presencia y resultados.
- [ ] Preparar el despliegue en Vercel conforme al plan básico.
- Verificación: ejecución local de pruebas, lint, tipos y build; revisión de configuración de CI.

## 5. Perfil local de la sesión

- [x] Solicitar nombre y apellidos antes de iniciar la práctica.
- [x] Permitir elegir un avatar predefinido y mostrarlo durante la sesión y el resultado.
- [x] Mantener el perfil solo en el estado local de la sesión, sin cuenta ni subida de imágenes.
- Verificación: flujo manual en navegador con nombre, apellidos y avatar seleccionados.

## 6. Claridad y accesibilidad de la interacción

- [x] Añadir ruta de regreso desde el formulario de perfil.
- [x] Exponer progreso, selección y foco mediante semántica accesible.
- [x] Aplicar reglas visuales persistentes y contraste AA a los estados interactivos.
- Verificación: snapshot del navegador y comprobaciones de contraste, lint y build.

## 7. Persistencia local de la sesión

- [x] Guardar perfil, pregunta actual, respuestas y estado de finalización en Redis como JSON con TTL.
- [x] Recuperar la sesión mediante una cookie anónima y rechazar payloads inválidos.
- [x] Mantener el reinicio explícito como una nueva práctica y eliminar la sesión remota.
- Verificación: flujo manual con recarga durante la práctica y validación de lint, tipos y build.

## 8. Protección del contenido de respuestas

- [x] Servir al cliente solo el enunciado y las opciones de cada pregunta.
- [x] Calcular la puntuación, respuesta correcta y explicación en Route Handlers del servidor.
- [x] Mostrar el resultado únicamente después de completar la sesión.
- Verificación: inspección del payload de preguntas, prueba del endpoint de resultado y build.

## 9. Mitigación de scraping y automatización abusiva

- [x] Exigir cookie de sesión válida antes de servir preguntas públicas.
- [x] Aplicar rate limit temporal en Redis por IP y endpoint.
- [x] Marcar la aplicación y sus APIs como no indexables y deshabilitar caché de respuestas.
- Verificación: peticiones sin cookie, peticiones repetidas y revisión de headers.

## 10. Vinculación temporal de sesión

- [x] Crear un binding HMAC de IP y agente de usuario sin guardar esos valores en claro.
- [x] Rechazar una cookie válida cuando el binding no coincide.
- [x] Documentar el secreto de binding como variable de entorno y conservar TTL.
- Verificación: lint, tipos, build y petición con contexto diferente.

## 11. Presencia administrativa

- [x] Registrar heartbeat temporal en Redis con nombre, avatar, foco y visibilidad de pestaña.
- [x] Mostrar sesiones activas en un panel `/admin` protegido por `ADMIN_DASHBOARD_KEY`.
- [x] Eliminar presencia al cerrar o reiniciar sesión y marcar como inactiva cuando expire el TTL.
- [x] Calcular el puesto administrativo sin exponer respuestas ni correcciones al cliente.
- [x] Publicar cambios en Redis Streams y consumirlos en el panel mediante SSE, con sincronización para expiraciones TTL.
- Verificación: heartbeat, consulta autorizada/no autorizada y build.

## Trazabilidad y continuidad

| Grupo | Requisitos | Verificación prevista |
| --- | --- | --- |
| 1 | REQ-005 | Validador del banco y revisión de contenido |
| 2 | REQ-001, REQ-002 | Prueba de interacción de sesión |
| 3 | REQ-003, REQ-004 | Prueba de cálculo, resultado y contexto |
| 4 | REQ-001–REQ-005 | Comandos de calidad, build y CI |
| 5 | REQ-006 | Flujo manual de perfil local en navegador |
| 6 | REQ-007 | Snapshot accesible, contraste y build |
| 7 | REQ-008 | API Redis, cookie anónima, recarga y build |
| 8 | REQ-009 | Payload público sin respuestas y cálculo de resultado en servidor |
| 9 | REQ-010 | Cookie requerida, rate limit, `no-store` y `robots.txt` |
| 10 | REQ-011 | Binding HMAC de IP/agente, rechazo y TTL |
| 11 | REQ-012, REQ-013, REQ-014 | Heartbeat Redis, ranking privado, Redis Streams y SSE |

- Siguiente acción: revisar el viewport móvil y preparar el despliegue en Vercel.
- Bloqueo real, si existe: ninguno para la implementación local; la selección editorial de fuentes y preguntas debe resolverse durante la carga del contenido.
