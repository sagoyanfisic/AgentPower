# Tech Stack

<!-- Generated/updated by $sdd-constitution -->

## Chosen Stack
| Layer        | Choice | Rationale |
|--------------|--------|-----------|
| Frontend     | Next.js + TypeScript | Integración directa con Vercel y una base adecuada para una aplicación web estática e interactiva. |
| Backend      | Route Handlers de Next.js | Encapsulan la lectura y escritura de sesiones anónimas desde la interfaz. |
| Database     | Redis; Docker Compose local y Redis administrado compatible en producción | Guarda el progreso temporal como JSON con TTL y sirve el banco activo desde `exam-gcp:question-bank:v1`; el JSON versionado solo es fuente de seeding. |
| Auth         | Ninguna en el MVP | La práctica debe poder iniciarse sin registro. |
| Hosting/CI   | Vercel en plan básico; GitHub Actions para validaciones | Mantiene el coste inicial bajo y automatiza comprobaciones antes del despliegue. |

## Discarded Alternatives
- Base de datos documental: se descarta porque el perfil y el progreso son documentos pequeños y temporales que Redis puede almacenar con TTL.
- Generación de contenido con IA en tiempo de ejecución: se pospone para mantener el contenido controlable, verificable y limitado a la documentación seleccionada.

## Technical Standards, Best Practices, and Security
- El contenido debe conservar la referencia a la documentación que fundamenta cada explicación.
- No incluir preguntas, respuestas ni material con acceso restringido; revisar licencias y atribución antes de publicar contenido.
- Validar la estructura del banco de preguntas durante el build o las pruebas.
- Sembrar el banco con `npm run seed:redis` antes de desplegar una instancia que use Redis administrado.
- No guardar secretos en el repositorio; `REDIS_URL` y las credenciales del proveedor deben vivir en variables de entorno y almacenes de secretos.
- Mantener el contenido separado de la lógica de presentación para permitir revisiones independientes.

## Comandos de la aplicación
Pendientes hasta elegir e implementar el stack. No hay runner de la app todavía.

| Finalidad | Comando | Directorio |
| --- | --- | --- |
| Desarrollo | `docker compose up -d redis` y `npm run dev` | Raíz del proyecto |
| Pruebas | `npm test` | Raíz del proyecto |
| Lint y tipos | `npm run lint` y `npm run typecheck` | Raíz del proyecto |
| Build | `npm run build` (`next build --webpack`) | Raíz del proyecto |

## Política de pruebas
Validación proporcional al cambio. TDD estricto solo si el usuario lo elige;
no se infiere de la presencia de tests. Documentar aquí esa decisión si cambia.

## Herramientas del harness
Python 3.9 o posterior, biblioteca estándar:
- `python3 scripts/check_harness.py`
- `python3 -m unittest discover -s tests/harness -v`

Estas comprobaciones verifican el harness, no la futura aplicación.
