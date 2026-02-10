# Proyecto: ts-uml-engine (Core)

> [!NOTE]
> Proyecto de carácter académico enfocado en el aprendizaje de compiladores y DSLs.
> Este repositorio contendrá las 3 etapas del compilador (Lexer, Parser, Generator/Intermediate Rep).
> Servirá como motor para una futura extensión de VS Code y un Playground Web.

## Roadmap de Implementación

### Fase 0: Pre-requisitos y Alineación (DOCUMENTACIÓN)
- [x] Análisis de la especificación técnica (UMLTS v0.8)
- [x] Definición de la arquitectura del compilador (Lexer -> Parser -> Mapper/Generator)
- [x] Definición del contrato de salida del AST (Esquema JSON)
- [x] Documentación de la gramática formal (EBNF-like)
- [x] Definición de estrategia de Git y Convención de Commits

### Fase 1: Entorno y Lexer (Análisis Léxico)
- [x] Configuración de entorno (TS, pnpm, vitest, nodemon)
- [x] Definición de Tokens (Keywords, Symbols, Identifiers)
- [x] Refactorización del Lexer (Principio Open-Closed / Matchers)
    - [x] Implementar operadores en parámetros.
    - [x] Eliminar redundancia visual (campos vs flechas).
    - [x] Posicionar roles en extremos de relación.
    - [x] Soporte de símbolos cortos (* abstract, $ static).
- [x] Implementación del Lexer (Lógica base)
- [x] Validación de tokens y manejo de errores léxicos (Tests passing)
- [x] PR creada y lista para merge [#1](https://github.com/thotluna/ts-uml-engine/pull/1)

### Fase 2: Parser (Análisis Sintáctico)
- [x] Definición de la Gramática (EBNF/Formal)
- [x] Implementación de Nodos del AST (Interfaces)
- [x] Refactorización del Parser (Arquitectura OCP / Rules)
- [x] Implementación del Recursive Descent Parser (Estructura base completa)
- [x] Manejo de errores sintácticos y recuperación (Diagnostics)
- [x] Validación con casos de prueba complejos
- [x] PR creada y lista para merge [#2](https://github.com/thotluna/ts-uml-engine/pull/2)

### Fase 3: Analizador Semántico e IR (Representación Intermedia)
- [x] Definición de Modelos de IR (Entidades y Relaciones resueltas)
- [x] Implementación de la Symbol Table (Registro de FQNs)
- [x] Implementación del Analizador Semántico (Segunda Pasada)
- [x] Generación automática de entidades implícitas
- [x] Validación de consistencia semántica
- [x] PR creada y lista para merge [#3](https://github.com/thotluna/ts-uml-engine/pull/3)
 
### Fase 4: API Pública y Empaquetado
- [x] Implementación de la clase `UMLEngine` (Fachada principal)
- [x] Integración de Lexer -> Parser -> Analyzer en un solo flujo
- [x] Exportación de tipos y modelos para uso como librería
- [x] Empaquetado formal como librería (Configuración de `package.json` y `exports`)
- [x] Automatización de build (dist/)

### Fase 5: Herramientas de Referencia (Diagramas)
- [x] Implementación de un `MermaidGenerator` (Generación de código Mermaid desde IR)
- [x] CLI simple para procesar archivos .umlts y emitir Mermaid
- [x] Corregir regresión: restaurar archivos `visitor.ts` y tests de semántica eliminados prematuramente.
- [x] Análisis arquitectónico de viabilidad para presentación (v0.8 READY).

---

## 🚀 Backlog / Futuras Mejoras

### 🏷️ Semántica UML Avanzada
- [x] **Relaciones In-line (ComBody)**: Implementado y establecido como el **estándar primario** de definición para mayor comodidad del usuario.
- [ ] **Restricciones (Constraints)**: Soporte para bloques `{xor}`, `{ordered}`, `{readOnly}` en relaciones y clases.
- [ ] **Asociaciones Cualificadas**: Soporte sintáctico para el "qualifier" (ej: `[asiento: Cadena]`) en los extremos de la relación.
- [ ] **Clases Asociación**: Soporte para la sintaxis y renderizado de clases que actúan como descriptores de una relación entre otras dos.
- [ ] **Notas y Comentarios**: Capacidad de anclar notas visuales a clases o relaciones específicas en el diagrama.

### 🛠️ DX & Tooling
- [ ] **Watch Mode**: Opción `--watch` en el CLI para regenerar el Mermaid automáticamente al guardar.
- [ ] **Exportación Multi-formato**: Integración con Mermaid CLI para exportar directamente a `.svg` o `.png`.
- [x] **Detección de Ciclos**: Advertencias semánticas cuando existen dependencias circulares complejas.
- [x] Limpieza de Código Muerto y Reorganización (v0.8.6): Carpeta `examples/` y `tools/`.
- [x] Corregir conflicto de `rootDir` en `tsconfig.json`.
- [x] Implementar descriptores de entidades (`*`) en relaciones.
- [x] Implementar soporte de documentación (JSDoc `/** ... */`).
- [x] Implementar Hovers Enriquecidos (Tooltips) para Entidades y Operadores.
- [x] Extraer JSON del AST para `manual_reference.umlts`.
- [x] Generar ejemplo completo de IR con todos los tokens en `examples/complete_tokens.umlts`.
- [x] Mejorar IR según requerimientos de renderizado:
    - [x] Implementar soporte para Genéricos (`typeParameters`) en AST e IR.
    - [x] Implementar soporte para Clases Activas (Keyword `active` y Símbolo `&`)
    - [x] Confirmar propagación de `docs` en todos los niveles (Entidades y Atributos).
    - [x] Confirmar preservación del orden de miembros.
