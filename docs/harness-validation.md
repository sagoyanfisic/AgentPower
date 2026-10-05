# Validación de la mejora del harness

Fecha: 2026-10-04. Alcance: instrucciones, skills y utilidades del harness.
Repositorio todavía sin commits; no se atribuye la evidencia a un `HEAD` inexistente.

## Comprobaciones ejecutadas

| Comprobación | Resultado |
| --- | --- |
| `python3 -B scripts/check_harness.py` | Correcto: 14 skills; estructura, invocaciones y enlaces locales |
| `python3 -B -m unittest discover -s tests/harness -v` | 9 pruebas aprobadas |
| Validador `quick_validate.py` de skill-creator sobre las 14 skills | Todas válidas |

Las pruebas verifican diagnóstico sin modificar archivos, repositorios sin historial,
referencias rotas, invocaciones desconocidas, configuración heredada, frontmatter
mal formado y trazabilidad con IDs vacíos, ausentes, duplicados o desconocidos.
También comprueban que leer etiquetas no ejecute el archivo de prueba.

Se corrigieron dos rutas heredadas hacia las skills auxiliares de pruebas y POC.
El comprobador de trazabilidad ahora devuelve error cuando faltan IDs o referencias,
y aclara que su resultado no demuestra ejecución ni cobertura funcional.

## Integración posterior

El 2026-10-04 se añadió la skill `ui-ux-pro-max` desde el commit
`477bcb28c9812b385cb51a4605ddf30d7b2266e2` del repositorio público
[nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill).
El diagnóstico del harness pasó con 15 skills. La copia completa de origen ejecutó
164 pruebas y todas pasaron; la copia aislada instalada conserva 137 pruebas
ejecutables, mientras que 4 pruebas esperan scripts del repositorio completo y no
se consideran fallos de la skill aislada. La búsqueda UI/UX se utilizó para aplicar
estados de foco visibles, etiquetas de formulario y `prefers-reduced-motion` en la app.

## Identificación de las utilidades verificadas

| Archivo | SHA-256 |
| --- | --- |
| `scripts/check_harness.py` | `26275d429be28d44c80cb8f29e7ccdb50f188b9ebad5f2e8b40a1aed80443b44` |
| `tests/harness/test_tools.py` | `969454caa703fd3c409b2f8d1c2b5f77844d954e5739224f629e003fd42a3ce9` |
| `.agents/skills/test-strategy/scripts/check_requirements_coverage.py` | `27244d12cec854ac37268b795678ee9d91d59bc9e73f35334369d0cfa431b258` |

Reejecutar las comprobaciones afectadas si cambia una utilidad, sus pruebas o los
recursos que examina. Estos hashes registran los archivos; no son un snapshot inmutable.

## Límites

No existe todavía una aplicación ni un stack elegido. No se ejecutaron pruebas de
producto, una auditoría de aplicación ni evaluaciones de comportamiento de las skills
con otro modelo. El diagnóstico estructural no valida YAML arbitrario; el validador
de skills se utilizó adicionalmente para el frontmatter de esta entrega.
