# umlts-renderer 🎨

Core rendering engine para el ecosistema **UMLTS**. Transforma representaciones intermedias (IR) de diagramas UML en archivos SVG limpios, profesionales y con soporte para temas.

## Características

- 🚀 **Pipeline Automatizado**: De JSON IR a SVG en un solo paso.
- 📐 **Layout Inteligente**: Integración con **ELK.js** para posicionamiento automático y rutas ortogonales.
- 🧊 **Anatomía UML**: Soporte para clases, interfaces, enums, miembros (visibilidad, abstractos, estáticos) y relaciones (herencia, asociación, dependencia, composición, agregación).
- 📦 **Soporte de Paquetes**: Visualización jerárquica de namespaces/paquetes.
- 🌓 **Temas Dinámicos**: Soporte nativo para modo claro y oscuro.

## Instalación

```bash
pnpm add umlts-renderer
```

## Uso Rápido

```typescript
import { render } from 'umlts-renderer';

const ir = {
  entities: [...],
  relationships: [...]
};

// Generar SVG string
const svg = await render(ir, { theme: 'dark' });
```

## API

### `render(ir: IR, options?: RenderOptions): Promise<string>`

La función principal de la biblioteca.

- `ir`: El objeto de representación intermedia generado por `ts-uml-engine`.
- `options`: 
  - `theme`: `'light'`, `'dark'` o un objeto `Theme` personalizado.

## Arquitectura de la Biblioteca

1. **IRAdapter**: Normaliza el IR de entrada al modelo interno.
2. **LayoutEngine**: Calcula dimensiones y posiciones usando algoritmos de flujo jerárquico.
3. **SVGRenderer**: Genera el XML final aplicando estilos y geometrías.

---
Desarrollado para el ecosistema UMLTS.
