---
name: sdd-feature
description: Crear o actualizar los requisitos, el plan y la validación de una funcionalidad concreta del proyecto SDD.
---

# sdd-feature

Lee `AGENTS.md`, la definición del proyecto y la fase relevante del roadmap. Prioriza la funcionalidad que el usuario haya solicitado.
Si el producto sigue sin definir, identifica las decisiones necesarias antes de dar requisitos por acordados. Pregunta solo cuando la conversación no resuelva una decisión material.
Revisa `git status` y la rama actual. Si corresponde crear una rama, usa `feat/nombre` desde `main` cuando exista y sea seguro; no cambies una rama con trabajo ajeno ni crees un commit inicial por tu cuenta.
Crea `specs/YYYY-MM-DD-nombre/` usando las tres plantillas de `specs/_template-feature/`. Documenta requisitos observables, límites, decisiones, grupos de tareas y validación. En una actualización, reutiliza la carpeta existente.
Registra el estado del plan y el alcance autorizado. No conviertas decisiones pendientes en aprobadas. Para UI, consulta `../brand-definition/SKILL.md` si es necesario definir reglas visuales; para una incertidumbre técnica concreta, considera `$sdd-poc`.
No implementes código de aplicación en esta etapa.

Antes de crear documentos, aplica la selección de flujo de `docs/harness.md`: una corrección acotada no necesita una carpeta artificial. Para funcionalidades sustanciales, usa IDs `REQ-001` y escenarios observables; vincula tareas y validación a esos IDs. Registra en `specs/state.md` la carpeta activa y el siguiente paso, y en `specs/decisions.md` únicamente las decisiones duraderas realmente acordadas.
