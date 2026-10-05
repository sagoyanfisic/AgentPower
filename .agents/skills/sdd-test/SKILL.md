---
name: sdd-test
description: Escribir o ejecutar pruebas para verificar los requisitos y criterios de aceptación de una funcionalidad SDD.
---

# sdd-test

Lee los requisitos y la validación de la funcionalidad activa y los comandos documentados en `specs/tech-stack.md`. Consulta `../test-strategy/SKILL.md` para elegir pruebas proporcionales.
Prioriza el flujo principal, validaciones y límites relevantes. No escribas pruebas triviales, de terceros o de reglas de negocio inventadas. Las plantillas Python auxiliares son ejemplos; usa el stack real del proyecto.
Ejecuta las comprobaciones necesarias y registra comando, resultado y limitaciones en `validation.md`. Si no hay aplicación o runner, explica qué falta; no declares que las pruebas pasan.
Ante fallos, distingue errores de prueba de defectos de aplicación. No debilites aserciones para ocultar un defecto. Si solo se pidió verificar, informa los defectos para una corrección posterior.

Vincula cada criterio `REQ-001` con una prueba o una comprobación manual. Las etiquetas `covers: REQ-001` son referencias, no prueba de cobertura funcional. El checker auxiliar no ejecuta tests.
Registra evidencia aplicable a los archivos y entorno verificados; diferencia aprobado, fallido, bloqueado y no ejecutado. Si cambia el comportamiento después, repite las verificaciones afectadas antes de mantener un criterio como aprobado.
