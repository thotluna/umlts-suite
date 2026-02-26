---
title: 'API del Renderizador (Renderer)'
description: 'Cómo transformar la IR en gráficos SVG de alta calidad.'
---

El paquete `@umlts/renderer` toma la **IR** producida por el motor y la convierte en una representación visual.

## Instalación

```bash
pnpm add @umlts/renderer
```

## Función `render()`

Es la forma más rápida de generar un diagrama.

```typescript
import { render } from '@umlts/renderer'

const svg = await render(diagram, {
  theme: 'dark',
})
```

## Clase `UMLRenderer`

Para un control más granular del ciclo de vida del renderizado.

### Métodos

- `render(ir: IRDiagram, options?: RenderOptions): Promise<string>`: El corazón del renderizador. Internamente calcula dimensiones, ejecuta ELK.js y genera el SVG.

## Configuración (`RenderOptions`)

| Opción        | Tipo                | Descripción                                           |
| :------------ | :------------------ | :---------------------------------------------------- |
| `theme`       | `'light' \| 'dark'` | Esquema de colores. El modo oscuro usa glassmorphism. |
| `elkOptions`  | `object`            | Ajustes para el motor de layout ELK.js.               |
| `showOptions` | `object`            | Filtros para ocultar o mostrar miembros o notas.      |

## Lo que entrega

El renderer devuelve un **String SVG** puro con metadatos e IDs únicos para interactividad.
