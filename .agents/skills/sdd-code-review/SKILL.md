---
name: sdd-code-review
description: Revisar en modo de solo lectura la calidad y el cumplimiento de requisitos de una funcionalidad SDD.
---

# sdd-code-review

Lee requisitos y validación y delimita los archivos modificados, preparados y nuevos con Git. Incluye los commits relevantes si hay una base; contempla repositorios sin commits.
Revisa cumplimiento del alcance, regresiones, manejo de errores, legibilidad, consistencia y duplicación significativa. Evita observaciones de estilo que ya resuelva el linter y problemas hipotéticos sin evidencia.
Reporta hallazgos accionables por prioridad con archivo y línea. Explica límites de la revisión y no declares pruebas ejecutadas si no se ejecutaron. No modifiques archivos; para una auditoría de seguridad utiliza `$sdd-security-review`.

Aplica la sección de evidencia y revisión de `docs/harness.md`. Identifica al inicio y al cierre los archivos examinados y la versión pertinente (commit si existe, y hashes de cambios sin commit cuando corresponda). Si el alcance cambia, no presentes el resultado como vigente: revisa los cambios adicionales o declara la limitación. No crees commits ni modifiques archivos para obtener una base de revisión. Este registro no congela el árbol de trabajo.
