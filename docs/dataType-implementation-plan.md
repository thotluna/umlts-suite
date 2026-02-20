# Implementation Plan: UML DataType Heuristics and Standard Library

This document outlines the strategy for implementing strict UML 2.5.1 `DataType` semantics in the `@umlts/engine`, ensuring a professional and normative representation of language-specific types.

## 1. Core Concepts

In UML 2.5.1, a `DataType` is a classifier whose instances are identified only by their value. Unlike a `Class`, it has no independent identity.

- **Identity vs. Value**: Two instances of a `DataType` with the same values are considered the same object.
- **Notation**: Represented with the `«dataType»` stereotype.

## 2. Implementation logic in `@umlts/engine`

### A. Language Plugin Level (`TypeScriptPlugin`)

The plugin will define the "Model Library" for the specific language.

1.  **Date, URL, RegExp, Error**: These will be registered in `getStandardLibrary()` using `IREntityType.DATA_TYPE`.
2.  **Primitive Mapping**: The `mapPrimitive` method will return `Date` for the `date` keyword, signaling the engine to use the reserved `DataType`.

### B. Semantic Heuristics (`EntityAnalyzer`)

The `EntityAnalyzer` will implement a "Promotion Logic" to automatically classify entities based on their structure:

1.  **Explicit `type` declarations**: In the DSL, if a statement starts with `type` (future syntax) or is identified by the plugin as a pure data structure, it becomes a `DataType`.
2.  **The "Zero Operations" Rule**:
    - During the `DefinitionPass`, the analyzer gathers all members.
    - If a `Class` or `Interface` has **zero operations** (methods) after processing all members, its `IREntityType` will be promoted/changed to `DATA_TYPE`.
3.  **Encapsulation Exception**: If a class has private fields but no methods, it might still be a `Class` if it's meant to have identity, but for UMLTS purposes, "Data Only" entities are better represented as `DataType`.

### C. Symbol Table & Resolution

1.  **Reserved Namespace**: Standard types will live in a virtual `TypeScript` namespace to avoid collisions with user code.
2.  **Global Aliasing**: The engine will provide a transparent mapping so that `createdAt: Date` resolves to `TypeScript.Date` without user intervention.

## 3. Visual Representation

The Generator (IR -> Mermaid/SVG) must be updated to:

- Detect `IREntityType.DATA_TYPE`.
- Prepend the `«dataType»` stereotype to the entity name.
- Ensure no "Id" or "Identity" related decorations are used for these entities.

## 4. Affected Files

- `packages/engine/src/generator/ir/models.ts`: Verify `IREntityType.DATA_TYPE` support.
- `packages/engine/src/plugins/typescript/typescript.plugin.ts`: Update standard library and primitives.
- `packages/engine/src/semantics/analyzers/entity-analyzer.ts`: Implement the promotion heuristic.
- `packages/engine/src/semantics/symbol-table.ts`: Ensure library types have priority.

## 5. Constraints

- **Circular Dependencies**: Ensure that promoting a class to `DataType` doesn't break established relationships in the `ResolutionPass`.
- **User Overrides**: If a user explicitly wants a class to be a `Class` even without methods, they should be able to force it (e.g., using a modifier or stereotype).
