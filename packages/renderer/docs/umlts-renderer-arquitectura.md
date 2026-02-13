# umlts-renderer — Arquitectura v2.0

> Librería SVG para renderizado fiel de diagramas de clases UML  
> Compatible con: Browser · VS Code WebView · Node.js headless · Electron

---

## 1. Ecosistema UMLTS

El proyecto está compuesto por tres paquetes. El renderer es el componente central de visualización, independiente de cualquier entorno de ejecución específico.

| Paquete          | Rol                         | Output                                    |
| ---------------- | --------------------------- | ----------------------------------------- |
| `umlts-engine`   | Lexer → Parser → AST → IR   | JSON con `entities[]` y `relationships[]` |
| `umlts-renderer` | IR → SVG _(este documento)_ | String SVG o archivo `.svg` / `.png`      |
| `umlts-vscode`   | Extensión VS Code           | WebView que consume `umlts-renderer`      |

> **Decisión de diseño: el renderer consume solo el IR**  
> El engine ya resuelve el grafo completo: entidades, relaciones, namespaces e implícitos.  
> El renderer no necesita conocer el AST ni tiene lógica semántica propia.  
> Esto hace que el renderer sea agnóstico al DSL y reutilizable con cualquier fuente.

---

## 2. Contrato del IR

El renderer acepta el JSON producido por `umlts-engine`. A continuación se documenta la estructura completa tal como la produce el engine actualmente.

### 2.1 Estructura raíz

```json
{
  "entities": "IREntity[]",
  "relationships": "IRRelationship[]"
}
```

### 2.2 IREntity

```ts
{
  id:         string,          // ej: "Domain.User", "Utils.Status"
  name:       string,          // nombre corto sin namespace
  type:       "Class" | "Interface" | "Enum",
  members:    IRMember[],
  isImplicit: boolean,         // true = referenciada pero no definida
  isAbstract: boolean,
  namespace:  string | undefined,
  line:       number | undefined,
  column:     number | undefined
}
```

### 2.3 IRMember — atributo o método

**Discriminador:** si el campo `parameters` existe (aunque sea array vacío) → es un método; si no existe → es un atributo.

```ts
// Atributo
{
  name:             string,
  type:             string,      // tipo de dato o clase referenciada
  visibility:       "+" | "-" | "#" | "~",
  isStatic:         boolean,
  isAbstract:       boolean,
  relationshipKind: string | undefined,  // ">*" ">+" ">-" ">>" ">I" ">"
  multiplicity:     string | undefined,  // "[1]" "[*]" "[1..*]"
  line:             number,
  column:           number
}

// Método
{
  name:       string,
  type:       string,           // tipo de retorno
  visibility: "+" | "-" | "#" | "~",
  isStatic:   boolean,
  isAbstract: boolean,
  parameters: IRParameter[],    // presencia = es método
  docs:       string | undefined,
  line:       number,
  column:     number
}
```

```ts
// IRParameter
{
  name:             string,
  type:             string,
  relationshipKind: string | undefined   // genera arista de dependencia
}
```

### 2.4 IRRelationship

```ts
{
  from:             string,     // id de entidad origen
  to:               string,     // id de entidad destino
  type:             RelType,
  label:            string | undefined,
  fromMultiplicity: string | undefined,  // "many" | "[1]" | "[1..*]" | "*"
  toMultiplicity:   string | undefined,
  line:             number | undefined,
  column:           number | undefined
}
```

### 2.5 Tipos de relación

| RelType (IR)     | Símbolo DSL        | Notación visual UML               |
| ---------------- | ------------------ | --------------------------------- |
| `Inheritance`    | `>> / >extends`    | Línea sólida + triángulo hueco    |
| `Implementation` | `>I / >implements` | Línea punteada + triángulo hueco  |
| `Composition`    | `>* / >comp`       | Línea sólida + rombo sólido negro |
| `Aggregation`    | `>+ / >agreg`      | Línea sólida + rombo hueco        |
| `Dependency`     | `>- / >use`        | Línea punteada + flecha abierta   |
| `Association`    | `>`                | Línea sólida + flecha abierta     |

### 2.6 Entidades implícitas

Cuando el engine encuentra una referencia a una clase no definida en el diagrama, la incluye en `entities[]` con `isImplicit: true` y `members: []`. El renderer las representa con un estilo diferenciado (fondo gris, borde punteado) para indicar que son tipos externos o pendientes de definir.

> ⚠️ **Multiplicidad — normalización necesaria**  
> El IR puede expresar la multiplicidad en dos formatos diferentes que el renderer debe normalizar:
>
> - Formato bracket: `"[1]"`, `"[*]"`, `"[1..*]"`, `"[0..1]"`
> - Formato texto: `"many"`, `"1"` (relaciones declaradas externamente)
>
> El renderer debe unificar ambos formatos antes de mostrarlos.

---

## 3. Pipeline de Renderizado

El renderer transforma el IR en SVG mediante un pipeline de tres etapas. Cada etapa es una función pura, sin efectos secundarios, lo que facilita el testing unitario y la composición.

```
  [IR JSON]  (umlts-engine output)
       │
       ▼
  ┌─────────────────────────────┐
  │   1. IRAdapter              │  normaliza y valida el IR
  │      · coerce multiplicidad │
  │      · detecta namespaces   │
  │      · discrimina attr/meth │
  └─────────────────────────────┘
       │  DiagramModel
       ▼
  ┌─────────────────────────────┐
  │   2. LayoutEngine (ELK.js)  │  calcula posiciones x,y
  │      · mide tamaño de nodos │
  │      · invoca ELK layered   │
  │      · devuelve LayoutResult│
  └─────────────────────────────┘
       │  LayoutResult
       ▼
  ┌─────────────────────────────┐
  │   3. SVGRenderer            │  genera string SVG
  │      · dibuja paquetes      │
  │      · dibuja aristas       │
  │      · dibuja nodos         │
  │      · aplica theme         │
  └─────────────────────────────┘
       │  SVG string
       ▼
  [Adapter]  Browser | VSCode | Node.js
```

### 3.1 Etapa 1 — IRAdapter

Responsabilidades:

- **Discriminar atributos de métodos:** si `member.parameters !== undefined` → método.
- **Normalizar multiplicidad:** `"many"` → `"*"`, `"1"` → `"1"`, `"[1..*]"` → `"1..*"` (elimina brackets).
- **Agrupar entidades por namespace:** entities con el mismo prefijo antes del punto comparten un paquete visual.
- **Separar entidades explícitas e implícitas:** las implícitas reciben un flag para renderizado diferenciado.
- **Producir DiagramModel:** la estructura interna del renderer, independiente del formato del engine.

### 3.2 Etapa 2 — LayoutEngine

Usa ELK.js para calcular posiciones. Antes de invocar ELK, calcula el tamaño de cada nodo midiendo el contenido textual:

- Ancho mínimo: 160px. Ancho real: `max(texto más largo × 7.5px, 160px)`.
- Alto: `32px (cabecera) + 24px por miembro + 8px de padding inferior`.
- Los nodos implícitos tienen altura fija reducida (solo cabecera).
- Los paquetes/namespaces se modelan como compound nodes en ELK.

### 3.3 Etapa 3 — SVGRenderer

Genera el SVG string en capas ordenadas:

| Capa SVG               | Contenido                            | z-order    |
| ---------------------- | ------------------------------------ | ---------- |
| `<g class="packages">` | Rectángulos de paquetes / namespaces | 1 (fondo)  |
| `<g class="edges">`    | Todas las aristas con marcadores     | 2          |
| `<g class="nodes">`    | Nodos de clase, interfaz, enum       | 3          |
| `<g class="labels">`   | Multiplicidad y roles sobre aristas  | 4          |
| `<g class="notes">`    | Notas flotantes                      | 5 (frente) |

---

## 4. Estructura del Paquete

```
packages/umlts-renderer/src/
├── index.ts                 ← API pública (render, mountToElement, ...)
│
├── core/
│   ├── ir-adapter.ts        ← IRAdapter: normaliza IR → DiagramModel
│   ├── layout-engine.ts     ← LayoutEngine: DiagramModel → LayoutResult
│   ├── svg-renderer.ts      ← SVGRenderer: LayoutResult → SVG string
│   ├── theme.ts             ← tipos Theme + lightTheme + darkTheme
│   └── types.ts             ← DiagramModel, LayoutResult, tipos internos
│
├── elements/
│   ├── class-node.ts        ← clase concreta y abstracta
│   ├── interface-node.ts    ← interfaz con «interface»
│   ├── enum-node.ts         ← enum con valores estáticos
│   ├── active-node.ts       ← clase activa (doble borde)
│   ├── implicit-node.ts     ← entidad implícita (estilo atenuado)
│   ├── package-node.ts      ← namespace / paquete
│   ├── note-node.ts         ← nota flotante
│   └── edges.ts             ← todas las aristas y marcadores SVG
│
├── adapters/
│   ├── browser.ts           ← mountToElement(ir, selector, opts)
│   ├── vscode.ts            ← renderForVSCode(ir, opts)
│   └── node.ts              ← renderToFile(ir, path, opts)
│
└── utils/
    ├── measure.ts           ← cálculo de tamaños de nodos
    ├── multiplicity.ts      ← normalización de multiplicidad
    └── svg-helpers.ts       ← builders de elementos SVG frecuentes
```

---

## 5. Renderizado de Nodos

### 5.1 Anatomía de una clase UML

Cada nodo se renderiza como un grupo `<g>` con tres compartimentos rectangulares apilados verticalmente:

```svg
<g class="node" data-id="Domain.User">

  <!-- Compartimento 1: cabecera -->
  <rect class="header" />
  <text class="stereotype">«abstract»</text>   <!-- si aplica -->
  <text class="name" font-style="italic">User</text>  <!-- cursiva si abstracta -->
  <rect class="type-params" />                 <!-- si tiene generics -->
  <text class="type-params-text">T, K</text>

  <!-- Compartimento 2: atributos -->
  <rect class="section" />
  <text>+ username : string</text>
  <text class="static">$ count : number</text>  <!-- subrayado si isStatic -->

  <!-- Compartimento 3: métodos -->
  <rect class="section" />
  <text class="abstract">+ validate() : void</text>  <!-- cursiva si isAbstract -->
  <text>+ login(cred) : boolean</text>

</g>
```

### 5.2 Variantes de nodo

| Tipo              | Indicador visual                        | Notas                          |
| ----------------- | --------------------------------------- | ------------------------------ |
| Class concreta    | Borde normal, nombre recto              |                                |
| Class abstracta   | Nombre en cursiva + `«abstract»`        | `isAbstract: true`             |
| Interface         | `«interface»` en cabecera, solo métodos | `type: Interface`              |
| Enum              | `«enum»` en cabecera, valores con `$`   | `type: Enum`, todos `isStatic` |
| Class activa      | Doble línea vertical en los bordes      | stereotype `«active»`          |
| Entidad implícita | Fondo gris claro, borde punteado        | `isImplicit: true`             |

### 5.3 Formato de miembros

| Campo               | Representación visual                            |
| ------------------- | ------------------------------------------------ |
| `visibility: "+"`   | `+` (public)                                     |
| `visibility: "-"`   | `-` (private)                                    |
| `visibility: "#"`   | `#` (protected)                                  |
| `visibility: "~"`   | `~` (package)                                    |
| `isStatic: true`    | Texto subrayado (`text-decoration: underline`)   |
| `isAbstract: true`  | Texto en cursiva (`font-style: italic`)          |
| `parameters: []`    | `nombre() : tipo` (paréntesis siempre presentes) |
| `parameters: [...]` | `nombre(param: tipo) : tipo`                     |

---

## 6. Renderizado de Aristas

### 6.1 Estructura SVG de una arista

```svg
<g class="edge" data-from="Domain.User" data-to="Domain.BaseEntity">

  <!-- Ruta calculada por ELK (waypoints ortogonales) -->
  <path d="M x1,y1 L x2,y2 ..." stroke-dasharray="..." />

  <!-- marker-end apunta al id del marcador según el tipo -->

  <!-- Label central (opcional) -->
  <text class="edge-label">hasState</text>

  <!-- Multiplicidad en extremo origen (opcional) -->
  <text class="multiplicity-source">many</text>

  <!-- Multiplicidad en extremo destino (opcional) -->
  <text class="multiplicity-target">1</text>

</g>
```

### 6.2 Marcadores SVG por tipo de relación

| Tipo             | Línea    | Marcador destino                | marker id      |
| ---------------- | -------- | ------------------------------- | -------------- |
| `Inheritance`    | Sólida   | Triángulo hueco (fill: blanco)  | `mk-inherit`   |
| `Implementation` | Punteada | Triángulo hueco (fill: blanco)  | `mk-implement` |
| `Composition`    | Sólida   | Rombo sólido (fill: negro)      | `mk-comp`      |
| `Aggregation`    | Sólida   | Rombo hueco (fill: blanco)      | `mk-agreg`     |
| `Dependency`     | Punteada | Flecha abierta (open arrowhead) | `mk-dep`       |
| `Association`    | Sólida   | Flecha abierta (open arrowhead) | `mk-assoc`     |

### 6.3 Normalización de multiplicidad

```ts
function normalizeMultiplicity(raw: string | undefined): string {
  // "many"   →  "*"
  // "1"      →  "1"
  // "[1]"    →  "1"
  // "[*]"    →  "*"
  // "[1..*]" →  "1..*"
  // "[0..1]" →  "0..1"
  // undefined → ""  (no se muestra)
}
```

---

## 7. API Pública

### 7.1 Función principal

```ts
import { render } from 'umlts-renderer'

const svg = await render(ir, {
  theme: 'light', // 'light' | 'dark' | Partial<Theme>
  layout: {
    direction: 'DOWN', // 'DOWN' | 'RIGHT'
    spacing: 60, // px entre nodos
  },
  width: 1200, // viewport (opcional, default auto)
  height: 900,
})
```

### 7.2 Adaptador Browser

```ts
import { mountToElement } from 'umlts-renderer/browser'

// Monta el SVG en el DOM e inicializa zoom/pan con wheel + drag
await mountToElement(ir, '#diagram', { theme: 'dark' })
```

### 7.3 Adaptador VS Code WebView

```ts
// En la extensión umlts-vscode:
import { renderForVSCode } from 'umlts-renderer/vscode'

const svg = await renderForVSCode(ir, options)
panel.webview.postMessage({ type: 'render', svg })

// En el HTML del WebView:
window.addEventListener('message', (e) => {
  document.getElementById('root').innerHTML = e.data.svg
})
```

### 7.4 Adaptador Node.js (headless export)

```ts
import { renderToFile } from 'umlts-renderer/node'

// Exportar SVG
await renderToFile(ir, './diagram.svg')

// Exportar PNG (requiere sharp como peer dependency)
await renderToFile(ir, './diagram.png', { format: 'png', scale: 2 })
```

---

## 8. Sistema de Theming

El theme es un objeto plano de tokens. Se exportan dos temas built-in (`lightTheme`, `darkTheme`). El usuario puede pasar un `Partial<Theme>` que se mergea sobre el tema base.

```ts
interface Theme {
  // — Nodos —
  nodeBackground: string // fondo del compartimento
  nodeBorder: string // borde del nodo
  nodeHeaderBg: string // fondo de la cabecera
  nodeHeaderText: string // nombre de la clase
  nodeMemberText: string // atributos y métodos
  nodeDivider: string // línea entre compartimentos
  nodeImplicitBg: string // fondo de entidades implícitas
  nodeImplicitBorder: string // borde punteado de implícitas
  // — Aristas —
  edgeStroke: string
  edgeStrokeWidth: number
  edgeLabel: string // color del texto label
  multiplicityText: string // color de la multiplicidad
  // — Tipografía —
  fontFamily: string // 'monospace' recomendado
  fontSizeBase: number // 13px
  fontSizeSmall: number // 11px (stereotype, multiplicidad)
  // — Paquetes —
  packageBackground: string
  packageBorder: string
  packageLabelText: string
  // — Notas —
  noteBackground: string
  noteBorder: string
}
```

---

## 9. Dependencias

| Paquete      | Versión | Rol                         | Entorno                  |
| ------------ | ------- | --------------------------- | ------------------------ |
| `elkjs`      | `^0.9`  | Auto-layout del grafo       | Todos                    |
| `web-worker` | `^1.3`  | ELK en Web Worker (browser) | Browser                  |
| `typescript` | `^5.4`  | Tipado estático             | Dev                      |
| `tsup`       | `^8`    | Build ESM + CJS             | Dev                      |
| `vitest`     | `^1`    | Testing unitario            | Dev                      |
| `sharp`      | `^0.33` | Exportar PNG                | Node.js (peer, opcional) |

> **Sin D3, sin Cytoscape, sin dependencias de DOM**  
> El SVG se genera como string puro → compatible con Node.js sin polyfills.  
> ELK.js tiene build WebAssembly → mismo código en browser y Node.js.  
> El bundle de runtime será ≈ 420KB (ELK wasm) + < 20KB (renderer).

---

## 10. Roadmap de Implementación

| Fase         | Entregable                                        | Criterio de completitud          |
| ------------ | ------------------------------------------------- | -------------------------------- |
| 1 — Tipos    | `types.ts`: DiagramModel, LayoutResult, Theme     | Tipado completo sin `any`        |
| 1 — Tipos    | `ir-adapter.ts`: IR → DiagramModel                | Tests con el IR de ejemplo       |
| 1 — Tipos    | `measure.ts` + `multiplicity.ts`                  | Normalización cubierta           |
| 2 — Layout   | `layout-engine.ts` con ELK layered                | Nodos sin solapamiento           |
| 2 — Layout   | Compound nodes para namespaces                    | `Domain.*` agrupado visualmente  |
| 3 — Renderer | `class-node` + `interface-node` + `enum-node`     | Los 3 tipos básicos renderizados |
| 3 — Renderer | `edges.ts` con los 6 tipos de aristas             | Marcadores SVG correctos         |
| 3 — Renderer | `implicit-node.ts`                                | Entidades implícitas atenuadas   |
| 4 — Adapters | `browser.ts` + `vscode.ts`                        | Funciona en WebView VS Code      |
| 4 — Adapters | `node.ts` (SVG + PNG headless)                    | Export desde CLI                 |
| 5 — UX       | Zoom / pan interactivo en browser                 | Wheel + drag                     |
| 5 — UX       | `lightTheme` + `darkTheme` built-in               | Switchable sin rerender          |
| 6 — Avanzado | `active-node`, `note-node`, `package-node` visual | Fidelidad UML completa           |
