---
title: 'API del Motor (Engine)'
description: 'Referencia completa del API de @umlts/engine.'
---

El paquete `@umlts/engine` es el responsable de la lógica, validación y resolución de símbolos.

## Instalación

```bash
pnpm add @umlts/engine
```

## Clase `UMLEngine`

Es el punto de entrada principal. El motor es agnóstico al renderizado; su única misión es producir una **Representación Intermedia (IR)** válida.

### Uso

```typescript
import { UMLEngine } from '@umlts/engine'

const engine = new UMLEngine()
const result = engine.parse('class User { +name: string }')
```

### Métodos

- `constructor(plugins?: IUMLPlugin[])`: Inicializa el motor. Puedes pasarle el [Plugin de TypeScript](/engine/typescript) para mejorar la inferencia de tipos.
- `parse(source: string): ParseResult`: Ejecuta el pipeline completo (Lexer -> Parser -> Semantics) sobre el texto plano.

## Interfaz `ParseResult`

Lo que el motor entrega tras el análisis:

| Propiedad     | Tipo           | Descripción                                                            |
| :------------ | :------------- | :--------------------------------------------------------------------- |
| `isValid`     | `boolean`      | `true` si no hay errores semánticos o de sintaxis.                     |
| `diagram`     | `IRDiagram`    | El objeto de datos (IR) que contiene todas las entidades y relaciones. |
| `diagnostics` | `Diagnostic[]` | Lista de errores o warnings con posición en el texto.                  |

## Representación Intermedia (IR)

La IR es un grafo de objetos normalizado que describe el diagrama:

- **Entities**: Clases, interfaces y enums con sus miembros.
- **Relationships**: Conexiones entre entidades (herencia, asociación, etc.).
- **Notes & Anchors**: Elementos de anotación vinculados a entidades.
