# Semantic Analyzer Refactoring Plan

## Goal

Break the bidirectional coupling between `SemanticAnalyzer` and its three visitor
classes, decompose responsibilities into single-purpose units, and establish a clean
extension point (`ITypeResolutionStrategy`) that keeps the UML core free of
language-specific logic.

## Principles

- **SRP**: one reason to change per class
- **OCP**: add new passes or resolvers without touching existing ones
- **DIP**: visitors depend on `AnalysisSession`, never on `SemanticAnalyzer`
- **ISP**: each class receives only the interface it needs
- **DRY**: `inferFromType` lives in exactly one place
- **KISS**: `SemanticAnalyzer` becomes a linear ~40-line orchestrator

---

## Target File Structure

```
semantics/
├── session/
│   ├── analysis-session.ts             (NEW) shared state carrier
│   ├── constraint-registry.ts          (NEW) dedup + constraint storage
│   └── config-store.ts                 (NEW) config merge + language activation
│
├── passes/                             (NEW dir, replaces inline visitors in analyzer.ts)
│   ├── discovery.pass.ts               (EXTRACT from DiscoveryVisitor)
│   ├── definition.pass.ts              (EXTRACT from DefinitionVisitor)
│   └── resolution.pass.ts              (EXTRACT from ResolutionVisitor)
│
├── inference/                          (NEW dir)
│   ├── member-inference.ts             (EXTRACT inferRelationships + inferFromType)
│   ├── type-resolution.pipeline.ts     (NEW) chains ITypeResolutionStrategy impls
│   ├── uml-type-resolver.ts            (NEW) UML-pure primitive/generic resolution
│   └── plugin-adapter.ts               (NEW) Adapter for LanguagePlugins
│
├── resolvers/
│   └── association-class.resolver.ts   (EXTRACT from ResolutionVisitor.visitAssociationClass)
│
├── analyzers/                          (unchanged)
│   ├── entity-analyzer.ts
│   ├── relationship-analyzer.ts
│   ├── constraint-analyzer.ts
│   └── type-inferrer.ts
│
├── validators/                         (unchanged)
│   ├── hierarchy-validator.ts
│   └── association-validator.ts
│
├── rules/                              (unchanged)
│   └── inference-rules.ts
│
├── utils/                              (unchanged)
│   ├── type-validator.ts
│   ├── fqn-builder.ts
│   └── multiplicity-validator.ts
│
├── symbol-table.ts                     (unchanged)
└── analyzer.ts                         (THIN orchestrator, ~40 lines)
```

---

## Step-by-Step Plan

### Step 1 — Create `ConstraintRegistry`

- [x] **File**: `session/constraint-registry.ts`
- [x] Extract `addConstraint` deduplication logic out of `SemanticAnalyzer`.

### Step 2 — Create `ConfigStore`

- [x] **File**: `session/config-store.ts`
- [x] Extract config management and language activation.

### Step 3 — Create `AnalysisSession`

- [x] **File**: `session/analysis-session.ts`
- [x] The central context object passed to all passes.

### Step 4 — Create `ITypeResolutionStrategy` interface

- [x] **File**: `inference/type-resolution.pipeline.ts`
- [x] Define extension point and pipeline orchestrator.

### Step 5 — Create `UMLTypeResolver`

- [x] **File**: `inference/uml-type-resolver.ts`
- [x] Implement UML-only primitive knowledge.

### Step 6 — Create `MemberInference`

- [x] **File**: `inference/member-inference.ts`
- [x] Extract `inferRelationships` + `inferFromType`.

### Step 7 — Create `AssociationClassResolver`

- [x] **File**: `resolvers/association-class.resolver.ts`
- [x] Extract `ResolutionVisitor.visitAssociationClass`.

### Step 8 — Extract `DiscoveryPass`

- [x] **File**: `passes/discovery.pass.ts`
- [x] Move `DiscoveryVisitor` to its own file.

### Step 9 — Extract `DefinitionPass`

- [x] **File**: `passes/definition.pass.ts`
- [x] Move `DefinitionVisitor` to its own file.

### Step 10 — Extract `ResolutionPass`

- [x] **File**: `passes/resolution.pass.ts`
- [x] Move `ResolutionVisitor` to its own file.

### Step 11 — Slim down `SemanticAnalyzer`

- [x] **File**: `analyzer.ts`
- [x] Refactor to pure orchestrator using new components.

### Step 12 — Wire plugin resolver into pipeline

- [x] **File**: `analyzer.ts`
- [x] Creates `PluginTypeResolutionAdapter` to bridge `LanguagePlugin` with `ITypeResolutionStrategy`.
- [x] Inject adapter into `TypeResolutionPipeline`.

### Step 13 — Update plugin contract

- [x] **Status**: Resolved via Adapter Pattern (Step 12).
- [x] No breaking changes to `LanguagePlugin` interface required.

### Step 14 — Run tests and verify

- [ ] Run `pnpm test`
- [ ] Verify build integrity

---

## Coupling Comparison

|                                       | Before                           | After              |
| ------------------------------------- | -------------------------------- | ------------------ |
| Visitors depend on `SemanticAnalyzer` | ✅ yes (bidirectional)           | ❌ no              |
| Core knows about plugins              | ✅ yes (inline in inferFromType) | ❌ no              |
| Domain logic in orchestrator          | ✅ ~300 lines                    | ❌ ~40 lines       |
| Files to touch for a new UML rule     | analyzer.ts + ?                  | only `validators/` |
| Files to touch for a new language     | analyzer.ts + plugin             | only new plugin    |
