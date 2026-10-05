# Brand Definition — AgentPower

> Fuente de verdad para la identidad visual y la voz del simulador.

## Product

- **Name:** AgentPower · GDG Open Certification Lab
- **Target Audience & Purpose:** Personas que se preparan para certificaciones de Google Cloud y necesitan practicar con explicaciones claras.
- **Desired Tone:** Técnico, claro y alentador.

## Color Palette

| Token | Value | Usage |
|---|---|---|
| `color-primary` | `#1A73E8` | Acciones principales, enlaces y progreso |
| `color-primary-deep` | `#202124` | Portada y superficies de alto contraste |
| `color-accent` | `#E8F0FE` | Superficies de bienvenida y selección |
| `color-text` | `#202124` | Texto principal |
| `color-muted` | `#5F6368` | Texto secundario |
| `color-background` | `#F8F9FA` | Fondo general |
| `color-card` | `#FFFFFF` | Tarjetas y formularios |
| `color-border` | `#DADCE0` | Separadores y controles |
| `color-focus` | `#1A73E8` | Indicador visible de foco |
| `color-error` | `#D93025` | Estado incorrecto, siempre acompañado de símbolo y texto |

### Contrast Verification

- El texto principal usa `#202124` y el secundario `#5F6368`; los acentos multicolor se reservan para señales visuales y siempre llevan texto o forma adicional.

## Typography

- **Primary Font:** Arial, Helvetica, sans-serif.
- **Type Scale:** 12px auxiliary, 14px secondary, 16px body, 18px lead, 24px section title, 32px main header, 48px hero.
- **Weights:** 400 regular, 700 bold.

## Tone of Voice

**Adjectives:** Directo, confiable, alentador, práctico.

**Copy Examples:**

- Error message: “Selecciona una respuesta para continuar.”
- Call to action: “Comenzar simulacro”.
- Empty state: “Todavía no hay preguntas disponibles.”

**What to Avoid:**

- Prometer preguntas oficiales o resultados de aprobación.
- Usar jerga motivacional vacía o culpabilizar a la persona por un error.
- Comunicar estados solo con color.

## Interaction Rules

- Todo control debe funcionar con teclado y mostrar foco visible.
- Las opciones deben tener un estado seleccionado programático y visual.
- El progreso debe comunicar pregunta actual y total, no solo una barra de color.
- Las transiciones son sutiles y se desactivan o reducen con `prefers-reduced-motion`.

## Pending Confirmation

- La familia tipográfica puede cambiarse cuando exista una preferencia de marca confirmada.
