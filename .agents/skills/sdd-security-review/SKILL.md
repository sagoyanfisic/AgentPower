---
name: sdd-security-review
description: Revisar la seguridad de cambios del proyecto y reportar hallazgos concretos antes de integrar una funcionalidad.
---

# sdd-security-review

Realiza una revisión de solo lectura. Consulta `../security-best-practices/references/security-checklist.md` y los requisitos relevantes.
Delimita el alcance con `git status`, cambios sin preparar, cambios preparados y archivos nuevos. Incluye commits de la funcionalidad respecto de la base si existe. En un repositorio sin commits, revisa los archivos pertinentes directamente; no dependas de `main...HEAD`.
Busca secretos, validación de entradas, inyección, autenticación, autorización, exposición de datos, abuso y errores que filtren información. Señala incertidumbre sobre dependencias cuando no se hayan verificado.
Reporta hallazgos con severidad, archivo, línea, impacto y recomendación concreta. Si no hay hallazgos, dilo junto con el alcance y las limitaciones. No edites código ni ejecutes scripts de la aplicación durante esta revisión. Las correcciones son una tarea posterior autorizada.

Aplica la sección de evidencia y revisión de `docs/harness.md`. Identifica al inicio y al cierre los archivos examinados y la versión pertinente (commit si existe, y hashes de cambios sin commit cuando corresponda). Si el alcance cambia, no presentes el resultado como vigente: revisa los cambios adicionales o declara la limitación. No crees commits ni modifiques archivos para obtener una base de revisión. Este registro no congela el árbol de trabajo.
