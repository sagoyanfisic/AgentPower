# AgentPower

AgentPower es el laboratorio de simulacros del GDG Open para practicar certificaciones de Google Cloud. Una persona entra a una sala con un código, completa su perfil, responde preguntas aleatorias dentro del tiempo asignado y recibe el puntaje junto con el contexto de cada respuesta al terminar.

La aplicación está pensada para sesiones guiadas por una persona organizadora. La administración crea una sala, la asocia con un banco de preguntas bilingüe y comparte el enlace o el `roomId` con los participantes.

## Qué incluye

- Salas con ventana de acceso y duración configurable.
- Perfil de participante con nombre, apellidos y avatar.
- Un intento por sala para cada vinculación temporal de dispositivo.
- Preguntas aleatorias servidas una por una.
- Práctica en español e inglés, con cambio de idioma durante el examen.
- Puntaje y revisión paginada al final, con respuesta correcta, explicación y fuente.
- Métricas privadas por sala y temas que requieren refuerzo.
- Presencia administrativa en tiempo real mediante Redis Streams y SSE.
- Carga y validación de bancos JSON desde el panel de administración.

La arquitectura completa está en [docs/architecture.md](docs/architecture.md). Las decisiones funcionales y técnicas se conservan en [specs/](specs/).

## Inicio rápido con Docker

Requisitos: Docker Desktop con Compose, Node.js 20 o posterior para ejecutar scripts locales y una copia del repositorio.

```bash
cp .env.example .env
```

Edita `.env` y reemplaza los valores de ejemplo por secretos aleatorios:

```dotenv
REDIS_PASSWORD=una-clave-larga-y-aleatoria
SESSION_BINDING_SECRET=otro-secreto-largo-y-aleatorio
ADMIN_DASHBOARD_KEY=una-clave-administrativa-larga
TRUST_PROXY=false
```

Levanta la aplicación:

```bash
docker compose up --build
```

Abre [http://localhost:3000](http://localhost:3000). El contenedor carga automáticamente el banco de preguntas versionado y el digest de la clave administrativa en Redis. La consola de administración está en `/admin`.

Redis queda publicado solo en `127.0.0.1:6379` y requiere contraseña. No expongas ese puerto a la red local o pública sin una configuración de red y autenticación equivalente.

Para detener los servicios:

```bash
docker compose down
```

Para borrar también el volumen local de Redis durante una prueba limpia:

```bash
docker compose down -v
```

## Desarrollo sin Docker

Necesitas un Redis accesible y una `REDIS_URL` con contraseña. Después:

```bash
npm install
npm run validate:content
npm run seed:redis
npm run dev
```

La aplicación queda en [http://localhost:3000](http://localhost:3000). Si Redis corre en Docker y Next.js en el host, usa `localhost` en `REDIS_URL`; si ambos corren en Compose, usa el nombre del servicio `redis`.

## Despliegue en Vercel y Redis Cloud

Vercel ejecuta Next.js como funciones Node.js. Redis Cloud conserva el banco, las salas, las sesiones y las métricas; Docker Compose se usa para desarrollo local.

1. Sube el repositorio a GitHub e impórtalo en Vercel como proyecto Next.js.
2. En Vercel configura estas variables para los entornos que usarás:

   | Variable | Uso |
   | --- | --- |
   | `REDIS_URL` | URL TLS de Redis Cloud, normalmente con esquema `rediss://`. |
   | `SESSION_BINDING_SECRET` | Firma del vínculo temporal de la sesión. |
   | `ADMIN_DASHBOARD_KEY` | Clave para entrar en `/admin`. |
   | `TRUST_PROXY` | `true` cuando Vercel es el proxy confiable de la aplicación. |

3. Desde un entorno seguro, con el mismo `REDIS_URL` de producción, carga el banco:

   ```bash
   REDIS_URL="rediss://usuario:clave@host:puerto" npm run seed:redis
   ```

4. Despliega y comprueba `/`, `/admin` y una sala de prueba.

El entrypoint de Docker no se ejecuta en Vercel. La aplicación puede crear el digest administrativo desde `ADMIN_DASHBOARD_KEY` si Redis todavía no tiene `exam-gcp:admin-key`, pero el banco de preguntas debe estar cargado antes de crear o usar salas.

Después de cambiar una variable de entorno en Vercel, crea un nuevo despliegue para que las funciones reciban el valor actualizado. Nunca subas `.env` ni claves reales al repositorio.

## Banco de preguntas

El contenido fuente está en [`src/content/questions.json`](src/content/questions.json). Debe contener preguntas bilingües con opciones, respuesta correcta, explicación, fuente y tema según el esquema validado por la aplicación.

Valida el archivo antes de cargarlo:

```bash
npm run validate:content
```

Cárgalo en Redis:

```bash
npm run seed:redis
```

La clave activa es `exam-gcp:question-bank:v1`. Las salas guardan la versión del banco que seleccionó la administración, por lo que un banco nuevo no cambia silenciosamente una práctica ya creada.

## Comandos

| Comando | Propósito |
| --- | --- |
| `npm run dev` | Servidor local de desarrollo. |
| `npm run build` | Compilación de producción de Next.js. |
| `npm run start` | Ejecuta la compilación de producción. |
| `npm run lint` | Revisa reglas de ESLint. |
| `npm run typecheck` | Comprueba los tipos de TypeScript. |
| `npm test` | Ejecuta la validación automatizada del contenido. |
| `npm run validate:content` | Valida el banco JSON sin modificar Redis. |
| `npm run seed:redis` | Carga el banco validado en Redis. |

Antes de integrar cambios, ejecuta:

```bash
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

## Rutas principales

| Ruta | Propósito |
| --- | --- |
| `/` | Landing y acceso por `roomId`. |
| `/room/:roomId` | Registro, examen y resultado de una sala. |
| `/admin` | Gestión de bancos, salas, métricas y presencia. |

Las rutas globales antiguas `/api/session`, `/api/questions` y `/api/session/result` responden `410`. Las preguntas requieren una sala válida y una sesión activa; la respuesta correcta no se envía durante la práctica.

## Seguridad y límites relevantes

- Las entradas se validan en el servidor y los cuerpos JSON están limitados a 5 MB.
- La sesión usa una cookie HttpOnly, SameSite Strict y Secure cuando corresponde.
- `correctOption`, explicaciones y fuentes permanecen en el servidor hasta el resultado final.
- Las rutas administrativas tienen autenticación, comparación segura y rate limiting.
- Redis local requiere contraseña y solo escucha en localhost.
- En producción usa Redis Cloud con TLS y configura `TRUST_PROXY=true` solo detrás del proxy confiable.
- La vinculación temporal ayuda a limitar el segundo intento, pero no sustituye cuentas o códigos individuales: otra red o navegador puede producir una vinculación diferente.

Consulta el detalle de claves, TTL, contratos HTTP y flujos en [docs/architecture.md](docs/architecture.md).

## Estructura del repositorio

```text
src/app/                 Páginas, layouts y Route Handlers de Next.js
src/components/          Componentes de la interfaz
src/lib/                 Redis, sesiones, preguntas, salas, métricas y auth
src/content/             Banco JSON versionado
scripts/                 Validación y carga del banco
docs/                    Arquitectura y documentación operativa
specs/                   Misión, stack, roadmap y funcionalidades SDD
.github/workflows/       Validaciones de integración continua
```

## Desarrollo guiado por especificaciones

El repositorio conserva las instrucciones de trabajo en [AGENTS.md](AGENTS.md). Antes de planificar una funcionalidad sustancial, revisa:

- [specs/mission.md](specs/mission.md): problema, usuarios y límites.
- [specs/tech-stack.md](specs/tech-stack.md): tecnologías y comandos acordados.
- [specs/roadmap.md](specs/roadmap.md): fases del producto.
- [specs/state.md](specs/state.md): estado real y siguiente paso.
- [specs/decisions.md](specs/decisions.md): decisiones que deben mantenerse.
- [docs/harness.md](docs/harness.md): adaptación del flujo SDD al repositorio.

Para una funcionalidad nueva, usa la plantilla de [`specs/_template-feature/`](specs/_template-feature/) y registra requisitos, plan y validación antes de implementar. Las skills locales de `.agents/skills/` se invocan desde Codex; no son dependencias de ejecución de la aplicación.

## Diagnóstico del harness

Estas comprobaciones revisan la estructura del repositorio y no sustituyen las pruebas de la aplicación:

```bash
python3 scripts/check_harness.py
python3 -m unittest discover -s tests/harness -v
```

Para retomar trabajo en otra sesión:

```text
Lee AGENTS.md, specs/state.md y la especificación de la funcionalidad activa.
Contrasta el estado con Git, resume los bloqueos y continúa dentro del alcance acordado.
```
