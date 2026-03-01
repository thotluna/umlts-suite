---
title: ¿Qué es UMLTS?
description: Introducción al lenguaje de modelado textual UMLTS y su motor de procesamiento.
---

UMLTS es un lenguaje de modelado textual (DSL) diseñado para describir diagramas UML mediante código. Su sintaxis es concisa, legible e inspirada en la estructura de TypeScript, permitiendo declarar clases, interfaces, relaciones y cualquier otro elemento del estándar UML directamente desde el editor, sin depender de herramientas visuales de arrastrar y soltar.

El objetivo central de UMLTS es que **escribir un diagrama sea tan natural como escribir código**: declaraciones en línea, inferencia de estructura por parte del motor, y una curva de aprendizaje mínima para cualquier desarrollador familiarizado con lenguajes tipados.

---

## El motor

El motor de UMLTS es una librería escrita en **Node.js / TypeScript** que toma como entrada código fuente UMLTS y produce una **representación intermedia (IR)** estructurada, lista para ser consumida por un renderer o cualquier pipeline de transformación propio.

El flujo de procesamiento es el siguiente:

```
Código fuente .umlts
        ↓
     Lexer / Parser
        ↓
  AST (Árbol Sintáctico)
        ↓
  IR — Intermediate Representation
        ↓
   Renderer / Exportador
```

El IR es un formato propio que abstrae la semántica del diagrama de cualquier detalle de renderizado. El renderer oficial consume este IR para generar diagramas en **SVG**.

---

## Salidas soportadas

| Salida                 | Estado        | Descripción                                                                                  |
| :--------------------- | :------------ | :------------------------------------------------------------------------------------------- |
| IR (formato propio)    | ✅ Disponible | Representación intermedia consumible por el renderer oficial u otros pipelines               |
| SVG                    | ✅ Disponible | A través del renderer oficial                                                                |
| XMI (UML 2.x estándar) | 🔜 En roadmap | Exportación al estándar de intercambio XMI para interoperabilidad con otras herramientas UML |

---

## Conformidad con UML 2.5

UMLTS tiene como meta de diseño ser **fiel al estándar UML 2.5.1**. Esto significa que los conceptos del DSL —clases, interfaces, enumeraciones, asociaciones, composiciones, agregaciones, perfiles, estereotipos y multiplicidades— mapean directamente a sus equivalentes normativos en la especificación de la OMG.

El roadmap contempla soporte progresivo para **todos los tipos de diagrama del estándar**:

- Diagrama de clases _(disponible)_
- Diagrama de secuencia
- Diagrama de casos de uso
- Diagrama de componentes
- Diagrama de despliegue
- Diagrama de actividad
- Diagrama de estados
- Y el resto de diagramas estructurales y de comportamiento definidos en UML 2.5

---

## ¿Por qué un DSL textual?

Las herramientas visuales de modelado UML son útiles para exploración inicial, pero presentan fricciones importantes en flujos de trabajo modernos:

- No se integran bien con control de versiones (Git).
- Los archivos binarios o propietarios son difíciles de revisar en pull requests.
- La colaboración asíncrona es limitada.
- Cambios pequeños en el modelo requieren interacción manual con la interfaz.

UMLTS resuelve estos problemas tratando el diagrama como **texto plano versionable**, que puede vivir junto al código fuente del proyecto, revisarse en un diff, generarse automáticamente y procesarse en pipelines de CI/CD.

---

## ¿Cómo se consume?

El motor se distribuye como una **librería JavaScript / TypeScript** y puede integrarse en cualquier proyecto Node.js:

```ts
import { UMLEngine } from 'umlts'

const source = `
class User {
  id: String
  email: String
}

class Order >> BaseEntity {
  total: Float
}

User [1] >< Order [0..*]
`

const ir = UMLEngine.parse(source)
// ir contiene la representación intermedia lista para renderizar o exportar
```

> **Nota:** La API pública está en desarrollo activo. Los nombres y firmas de las funciones pueden cambiar hasta alcanzar una versión estable.

---

## Estado actual

UMLTS se encuentra en **desarrollo activo**. La prioridad actual es la cobertura completa del diagrama de clases según UML 2.5.1, incluyendo perfiles, estereotipos, restricciones y clases de asociación.

Se recomienda no usar UMLTS en entornos de producción hasta la publicación de una versión `1.0` estable.
