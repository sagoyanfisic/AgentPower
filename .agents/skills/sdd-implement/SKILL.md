---
name: sdd-implement
description: Implementar o continuar una funcionalidad del proyecto a partir de su plan SDD y del alcance autorizado por el usuario.
---

# sdd-implement

Determina si la solicitud es una funcionalidad sustancial o un cambio acotado según `docs/harness.md`. Para una funcionalidad, localiza la carpeta indicada o la asociada a la tarea activa; no elijas solo por fecha si hay varias candidatas. Lee sus requisitos, plan y validación junto con `AGENTS.md` y el stack. Para un cambio acotado, consulta únicamente el contexto pertinente.
Si falta el plan para una funcionalidad sustancial, prepáralo con `$sdd-feature`. Para un cambio acotado, sigue la ruta directa de `docs/harness.md`. Resuelve decisiones materiales pendientes antes del trabajo dependiente. Usa la autorización ya presente en la conversación.
Ejecuta los grupos pendientes dentro del alcance solicitado. Mantén actualizaciones breves; no exijas otra confirmación después de cada grupo salvo que el usuario haya pedido ese ritmo.
Aplica los patrones del repositorio, conserva cambios ajenos y verifica el resultado con los comandos apropiados. Marca tareas terminadas solo tras verificarlas y documenta bloqueos reales.
Al concluir, informa qué cambió, qué se verificó y qué falta. No hagas commits, push, merge ni despliegues por el mero hecho de terminar el plan.

Antes de modificar, inspecciona el flujo afectado y reproduce el fallo cuando exista. Respeta el modo de pruebas documentado en `specs/tech-stack.md`; no supongas TDD estricto. Si está habilitado, registra fallo funcional, éxito y refactorización verificada.
Al verificar, registra el comando y resultado observado junto con el alcance revisado. Si cambian los archivos o dependencias relevantes, repite las comprobaciones afectadas. Al finalizar o ante un bloqueo real, actualiza `specs/state.md` con enlaces al plan, la evidencia y la siguiente acción.
