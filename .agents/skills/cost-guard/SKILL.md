---
name: cost-guard
description: Organizar lecturas y contexto para tareas extensas del proyecto cuando se necesite reducir lecturas repetidas o preparar la continuidad entre sesiones.
---

# Contexto y continuidad

- Busca con `rg` y lee los archivos pertinentes. No releas datos ya disponibles ni vuelques el repositorio completo.
- Guarda decisiones y estado del trabajo en `specs/`; usa `AGENTS.md` para convenciones estables y breves.
- Respeta el modelo y el alcance de la sesión. No impongas modelos, delegación o reinicios por un porcentaje arbitrario de contexto.
- Continúa el trabajo autorizado; al retomar, lee el plan y verifica su estado real.
- Consulta `references/context-discipline.md` para búsquedas y `references/session-hygiene.md` para información que conviene persistir.
- `references/model-routing.md` y `scripts/pick_model.py` ofrecen orientación sobre el enfoque de una tarea, no configuran modelos.
- `scripts/context_budget_check.sh` informa del tamaño de archivos. Sus umbrales son orientativos.
- Las plantillas de `assets/` son referencias; no reemplaces instrucciones existentes automáticamente.

- Al retomar, empieza por `specs/state.md`; consulta `specs/decisions.md` y la funcionalidad activa solo cuando sean pertinentes. Al cerrar trabajo sustancial, guarda siguiente acción y enlaces a evidencia. Contrasta la memoria con el estado real antes de confiar en ella.
