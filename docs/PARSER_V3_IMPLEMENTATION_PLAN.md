# Plan de Implementación: Parser V3 "The Modular Orchestra"

Este documento detalla los pasos técnicos para transformar la arquitectura actual del parser en un sistema modular, extensible y de responsabilidad única.

## Fase 1: Infraestructura y Contratos Estrictos

El objetivo es preparar los cimientos sin romper el parser actual.

### 1.1 Creación de la `ASTFactory`

- **Ubicación:** `src/parser/factory/ast.factory.ts`
- **Responsabilidad:** Centralizar la creación de todos los tipos de `ASTNode`.
- **Métodos:** `createProgram()`, `createClass()`, `createInterface()`, `createEnum()`, `createAttribute()`, etc.
- **Beneficio:** Elimina los casts `as Node` dispersos por las reglas.

### 1.2 Interfaz `IParserHub` y Refactor de `ParserContext`

- **Ubicación:** `src/parser/core/parser.hub.ts`
- **Acción:** Definir una interfaz que solo exponga métodos de lectura y consumo seguro (no gestión de estado interno).
- **Refactor:** `ParserContext` implementará esta interfaz.

### 1.3 `ParserSession` y `StateStore`

- **Acción:** Extraer la lógica de `pendingDocs` a un objeto `ParserSession`.
- **Mecánica:** Cada vez que el parser intenta una nueva sentencia, la sesión puede reiniciarse o limpiarse, evitando que comentarios de una clase fallida se peguen a la siguiente.

## Fase 2: Desacoplamiento de Reglas y Estrategias

### 2.1 Refactor de `MemberRegistry` (Adiós a los Statics)

- **Acción:** Convertir las propiedades estáticas de `MemberRegistry` en propiedades de instancia.
- **Inyección:** El `Parser` recibirá el registro por constructor (Inyección de Dependencias).

### 2.2 Descomposición de la "Big Entity Rule"

- **Creación de `EnumRule`:** Extraer toda la lógica de `enum Name { ... }` y `enum Name(LITERALS)` de `EntityRule.ts`.
- **Creación de `AssociationClassRule`:** Extraer la lógica de `class C <> (A, B)`.
- **Resultado:** `EntityRule.ts` solo se encargará de Clases e Interfaces básicas.

## Fase 3: Orquestación Basada en Composición

### 3.1 Unificación de la Interfaz de Reglas

- **Acción:** Asegurar que tanto `StatementRule` como `MemberProvider` sigan patrones idénticos:
  - `canHandle(context)`: Heurística rápida (lookahead 1-2).
  - `parse(context, orchestrator)`: Lógica de procesamiento pesada.

### 3.2 `Parser` Slim (El Director de Orquesta)

- **Refactor:** El bucle `parseStatement` en `parser.ts` se vuelve un simple iterador sobre `this.rules.find(r => r.canHandle(context))`.

## Fase 4: Sincronización Avanzada (Panic Mode)

### 4.1 Heurística de Recuperación

- **Mecánica:** En caso de error, el `Orchestrator` pide a todas las reglas registradas su "señal de inicio" (`canStart`).
- **Sincronización:** El `TokenStream` avanza hasta que alguna regla diga "aquí puedo empezar yo de nuevo con seguridad".

---

## Orden de Ejecución Sugerido

1. [x] **Implementar `ASTFactory`** (Bajo riesgo, alta recompensa en tipado).
2. [x] **Extraer `EnumRule`** (Reduce la complejidad de `EntityRule` drásticamente).
3. [x] **Inyectar `MemberRegistry`** (Prepara el terreno para plugins reales).
4. [x] **Refactorizar `ParserContext`** hacia `IParserHub`.
5. [x] **Migrar el Orchestrator** al nuevo bucle de composición.
