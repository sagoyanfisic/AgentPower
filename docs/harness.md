# Cómo trabajar con este harness

El harness reúne instrucciones, skills, contexto persistente y comprobaciones locales.
Su finalidad es que Codex pueda retomar el trabajo y justificar qué verificó.

## Elegir el flujo

| Solicitud | Trabajo necesario |
| --- | --- |
| Consulta o exploración | Leer y responder; no crear planes ni modificar archivos por defecto |
| Cambio acotado y entendido | Inspeccionar, modificar y comprobar el comportamiento afectado |
| Funcionalidad sustancial o cambio entre varios componentes | Requisitos, plan por resultados y validación en una carpeta de `specs/` |
| Decisión técnica incierta | Experimento acotado con `$sdd-poc` si la evidencia disponible no basta |
| Revisión | Inspección de solo lectura y hallazgos concretos |
| Continuación | `$sdd-resume`, comprobar estado real y seguir el alcance autorizado |

La cantidad de archivos no determina por sí sola la complejidad. Evalúa efectos:
datos, autenticación, contratos públicos, concurrencia y despliegue merecen más
validación que una corrección editorial. No impongas una fase adicional a cada tarea.

## Contexto con responsables claros

- `AGENTS.md`: convenciones estables y puntos de entrada.
- `specs/state.md`: funcionalidad activa, evidencia reciente, bloqueos y siguiente acción.
- `specs/decisions.md`: decisiones acordadas y razones; enlaza el detalle en vez de duplicarlo.
- Carpeta de la funcionalidad: alcance, tareas y criterios de aceptación.
- `specs/tech-stack.md`: herramientas y comandos reales, incluido el modo de pruebas.

Lee primero el estado y después solo los documentos pertinentes. Si una memoria
contradice al código o a la instrucción actual del usuario, verifica y corrige el
registro. No guardes secretos, transcripciones completas ni razonamiento interno.
No hace falta actualizar todos los documentos después de una pregunta breve.

## Implementación y pruebas

1. Inspecciona el flujo afectado y reproduce el fallo cuando exista.
2. Elige una comprobación observable. Para corregir bugs, una regresión automatizada
   es útil cuando protege comportamiento y el entorno lo permite.
3. Cambia lo necesario y ejecuta las verificaciones pertinentes.
4. Revisa el diff, incluidos archivos nuevos y preparados, y registra resultados.

El modo predeterminado es validación proporcional. Si el usuario elige TDD estricto,
regístralo en el stack: fallo por el comportamiento esperado, implementación mínima,
éxito y refactorización con pruebas en verde. Un error de importación o del entorno
no es una demostración válida del fallo funcional. Sin código ejecutable, informa
la limitación en lugar de inventar un runner o un resultado.

## Evidencia y revisión

Cada criterio `REQ-001` debe enlazar una prueba o un procedimiento manual con resultado.
El script auxiliar de trazabilidad busca etiquetas `covers: REQ-001`; no ejecuta pruebas.

Para una revisión o verificación registra:

- Fecha, rama y commit si existe; en este repositorio inicial puede no haber `HEAD`.
- Archivos revisados, incluidos nuevos, preparados y eliminados.
- Comando exacto, resultado y limitaciones; marca explícitamente lo no ejecutado.
- Para una base más precisa, hashes SHA-256 de los archivos examinados al inicio y
  al cierre, o un commit inmutable si ya existe. No crees commits solo para obtenerlo.

Si cambia el alcance revisado, los hashes, el código, la configuración o las dependencias
pertinentes, la evidencia anterior requiere revalidación. Un commit por sí solo no
identifica cambios sin commit. Los hashes manuales tampoco congelan el árbol ni detectan
cambios transitorios durante una ejecución: esta práctica es un registro local, no el
protocolo de revisión inmutable de Gentle-AI.

Revisa según el riesgo: requisitos y regresiones; permisos y exposición de datos;
errores y recuperación; consistencia y mantenibilidad. Sustenta cada hallazgo con
archivo, ubicación, impacto y evidencia. Tras corregirlo, repite las comprobaciones
afectadas. Si reaparece un fallo sin nueva evidencia, diagnostica la causa antes de
repetir el mismo intento. No amplíes la revisión indefinidamente por preferencias de estilo.

## Herramientas locales

```bash
python3 scripts/check_harness.py
python3 -m unittest discover -s tests/harness -v
```

El diagnóstico es de solo lectura y usa la biblioteca estándar de Python. Comprueba
la estructura mínima del frontmatter, nombres de skills, invocaciones y referencias
locales. No es un parser YAML completo, no ejecuta las skills y no prueba su calidad
de razonamiento ni la seguridad de la app. Devuelve 1 si hay problemas estructurales.

## Origen y decisiones de adaptación

Referencia examinada: [Gentle-AI, revisión aa943657](https://github.com/Gentleman-Programming/gentle-ai/tree/aa94365734ad5753bc5ab6e7658c7d0054cf8b42).
Su rama principal puede incluir cambios aún no publicados.

| Práctica consultada | Adaptación local |
| --- | --- |
| [ODD y proceso proporcional](https://github.com/Gentleman-Programming/gentle-ai/blob/aa94365734ad5753bc5ab6e7658c7d0054cf8b42/README.md) | Flujo corto para cambios acotados; SDD para funcionalidades sustanciales |
| [Memoria con Engram](https://github.com/Gentleman-Programming/gentle-ai/blob/aa94365734ad5753bc5ab6e7658c7d0054cf8b42/docs/engram.md) | Estado y decisiones en Markdown versionable |
| [Revisión ligada a una versión](https://github.com/Gentleman-Programming/gentle-ai/blob/aa94365734ad5753bc5ab6e7658c7d0054cf8b42/docs/review-integration.md) | Registro del alcance y revalidación si cambia; sin implementar su protocolo RDD |
| [Diagnóstico y capacidades de Codex](https://github.com/Gentleman-Programming/gentle-ai/blob/aa94365734ad5753bc5ab6e7658c7d0054cf8b42/docs/agents.md) | Comprobador local de estructura, sin instalar servicios |

Las skills se cargan cuando son pertinentes. No se instalan Gentle-AI, Engram, MCP,
hooks globales ni modelos adicionales. Tampoco se activa delegación obligatoria.
Si esas integraciones resultan necesarias, se evaluarán por separado.
