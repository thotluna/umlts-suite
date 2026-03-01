---
name: umlts-modeler
description: Expert in generating UML class diagrams from natural language using the UMLTS DSL. Transforms system descriptions, domain models, and requirements into valid, semantically correct UMLTS code grounded in UML 2.5.1 specification.
---

# UMLTS Modeler — Natural Language to UML Diagrams

This skill transforms **natural language descriptions** of systems, domains, or requirements into **valid, semantically correct UMLTS code**. Every modeling decision is grounded in UML 2.5.1 and the UMLTS DSL specification.

## When to Use This Skill

Use this skill when:

- A user describes a system, domain, or requirement in natural language and expects a UML class diagram.
- Modeling an existing domain (e-commerce, banking, healthcare, education, etc.).
- Translating written requirements or user stories into structural UML models.
- Prototyping a domain model quickly with correct UML semantics.

---

## Behavioral Contract

### 1. Input → Output Flow

1. **Input**: Always a natural language description. Never raw code.
2. **Output**: Always UMLTS code **first**. Explanations, assumptions, or notes go **after** the code block.
3. **No Clarification Before First Model**: Produce the best possible interpretation from the input. Report ambiguities and assumptions **after** the generated code.

### 2. Declaration Style — Inline First

All relationships **MUST** prefer **in-line** and **intra-class** declarations over external loose statements.

**Use in-line declarations when:**

- The relationship has a clear owner (composition, aggregation, navigable association).
- Only one end needs multiplicity.

**Use external declarations ONLY when:**

- Multiplicities on **both** ends must be explicit (e.g., `User [0..*] >< Role [1]`).
- An **association class** is required (e.g., `class Enrollment <> (Student[*], Course[*])`).
- A **relationship label** is needed.

#### Example — CORRECT (In-line)

```umlts
class Order {
  items: >* OrderLine[1..*]
  customer: >< Customer
  payment: >< Payment[0..1]
}
```

#### Example — INCORRECT (Unnecessary external declarations)

```umlts
// DON'T: External when in-line is sufficient
class Order
class OrderLine
Order >* OrderLine [1..*]
Order >< Customer
```

### 3. Types — UML 2.5.1 Standard Only

When no language plugin is active in the context, use **exclusively** the five UML 2.5.1 primitive types:

| UML Type  | Usage                       |
| :-------- | :-------------------------- |
| `String`  | Text values                 |
| `Integer` | Whole numbers               |
| `Boolean` | True/False flags            |
| `Float`   | Decimal numbers             |
| `Date`    | Temporal values (extension) |

**NEVER** use language-specific types: `string`, `int`, `bool`, `number`, `double`, `char`, `long`.

If a **language plugin** is active (e.g., `config { language: typescript }`), that plugin's type registry replaces this rule with language-appropriate types.

### 4. Relationship Semantics — Choose Correctly

Every relationship **MUST** use the semantically correct operator. Using `><` (association) as a catch-all is a modeling failure.

| Operator | Name                    | When to Use                                                      |
| :------- | :---------------------- | :--------------------------------------------------------------- |
| `>*`     | Composition             | Child lifecycle depends on parent. Destruction cascades.         |
| `>+`     | Aggregation             | Parent references child, but child exists independently.         |
| `><`     | Association (navigable) | Structural reference. One side "knows" about the other.          |
| `<>`     | Association (bidir)     | Both sides know each other. Mutual navigation.                   |
| `>-`     | Dependency              | Transient usage. One class uses another in a method, not stored. |
| `>>`     | Inheritance             | "Is-a" relationship. Single inheritance only.                    |
| `>I`     | Implementation          | Class fulfills an interface contract. Multiple allowed.          |

#### Decision Tree

```
Does A own B's lifecycle?
├── YES → >* (Composition)
├── NO, but A contains B loosely?
│   └── YES → >+ (Aggregation)
├── NO, A just references B structurally?
│   ├── Both sides reference each other → <> (Bidirectional)
│   └── Only A → B → >< (Association)
├── A uses B only temporarily (method param, local var)?
│   └── YES → >- (Dependency)
├── A "is-a" B?
│   └── YES → >> (Inheritance)
└── A fulfills B's contract?
    └── YES → >I (Implementation)
```

### 5. Multiplicities — Always Explicit

Every relationship **MUST** have explicit multiplicity on the member type or on both ends (for external declarations).

| Syntax   | Meaning      |
| :------- | :----------- |
| `[1]`    | Exactly one  |
| `[0..1]` | Optional     |
| `[*]`    | Zero or more |
| `[1..*]` | One or more  |
| `[n..m]` | Range n to m |

**In-line**: Multiplicity goes on the type:

```umlts
class Team {
  members: >+ Player[1..*]
  coach: >< Coach[1]
}
```

**External**: Multiplicity goes on both ends:

```umlts
Student [0..*] >< Course [1..*]
```

### 6. Packages — Bounded Contexts

Use `package` blocks when the description implies:

- Separate modules or layers (Core, Security, Billing).
- Bounded contexts (DDD).
- Distinct domains or subsystems.

```umlts
package Core {
  class User {
    id: String
    email: String
  }
}

package Security {
  class Token {
    value: String
    expiresAt: Date
  }
}
```

### 7. XOR Constraints

Use `xor` blocks when the description implies **mutually exclusive** relationships:

```umlts
xor {
  Payment >< CreditCard
  Payment >< BankTransfer
  Payment >< Crypto
}
```

### 8. Notes — Non-Structural Rules

Use `note` for business rules that **cannot** be expressed structurally:

```umlts
note "A student cannot enroll in more than 6 courses per semester" as N1
N1 .. Student
```

### 9. Assumptions Report

After the UMLTS code block, if **non-trivial** modeling decisions were made, list them briefly:

```
**Assumptions:**
1. Interpreted "has many items" as Composition (>*), assuming items cannot exist without the parent Order.
2. Used package separation for Core vs Billing as the description mentions "modules".
3. Modeled PaymentMethod as XOR since only one can be active per transaction.
```

Only list assumptions when:

- The description was ambiguous about ownership semantics (composition vs aggregation).
- You inferred package boundaries.
- You chose a specific relationship type where multiple could apply.
- You added constraints or notes from implicit requirements.

### 10. UML 2.5.1 Specification Lookup

When semantic ambiguity arises about **any** UML 2.5.1 concept — including the correct use of relationships, multiplicities, stereotypes, constraints, or structural/behavioral elements — the skill **MUST** consult the **NotebookLM MCP** using the notebook titled:

> **"UML Semantics, Notation, and Reference Guide"**

This consultation must happen **before** making assumptions or defaulting to a common interpretation. The goal is to ground every modeling decision in the UML 2.5.1 specification, not in convention or approximation.

**How to consult:**

1. Use `mcp_notebooklm_notebook_list` to find the notebook ID for "UML Semantics, Notation, and Reference Guide".
2. Use `mcp_notebooklm_notebook_query` with a precise question about the UML concept in question.
3. Incorporate the answer into the modeling decision.

If NotebookLM is unavailable (authentication error), proceed with the best UML 2.5.1 interpretation and flag the assumption explicitly.

---

## UMLTS DSL Quick Reference

The full DSL specification is available at `docs/dsl-guide.md` in the project root. **Always consult it** when uncertain about syntax.

### Entity Declarations

```umlts
class Person                       // Simple class
class *Animal                      // Abstract class
class !FinalService                // Leaf (non-inheritable)
class &ActiveWorker                // Active class (thread)
interface Serializable<T>          // Generic interface
enum Status(ACTIVE | INACTIVE)     // Inline enum
```

### Member Syntax

```
[docs] [visibility] [modifiers] name [( params )] : [relation_operator] [target_modifiers] Type [multiplicity] [= default] [constraints] [notes]
```

### Relation in Header

```umlts
class Hero >> Character >I IFighter >I IHealer
```

### Relation in Members (In-line)

```umlts
class Car {
  engine: >* Engine[1]              // Composition
  owner: >< Person[1]              // Association
  passengers: >+ Person[0..*]      // Aggregation
  handler: >- IEventHandler        // Dependency
}
```

### External Declaration (When Required)

```umlts
User [0..*] >< Role [1]
Student [*] <> Course [*]
class Enrollment <> (Student[*], Course[*]) {
  enrolledAt: Date
}
```

### Config

```umlts
config {
  direction: "top-bottom"
  showPackages: true
}
```

### Profiles and Stereotypes

```umlts
profile Backend {
  stereotype Entity >> class {
    table: String
    schema: String = "public"
  }
}

@Entity
class User {
  id: String
  [ table="users" ]
}
```

> **Metaclass casing**: Keywords (`class`, `interface`, `enum`, `package`) work as-is. Non-keyword metaclasses require PascalCase: `Property`, `Operation`, `Association`.

---

## Anti-Patterns (NEVER DO)

1. **Catch-all Association**: Using `><` for everything. Analyze ownership semantics.
2. **Missing Multiplicities**: Every relationship end must state how many.
3. **Language-Specific Types**: `string`, `int`, `number` → Use `String`, `Integer`, `Float`.
4. **External When Inline Suffices**: If the relationship has a clear owner, declare it inside the class body.
5. **Empty Classes**: Every class should have at least one attribute or meaningful relationship. If a class exists only to participate in a hierarchy, it should still have structural purpose.
6. **Explanation Before Code**: The UMLTS code block **always** comes first.

---

## Project Context

This skill operates within the `umlts-suite` monorepo:

- **Engine**: `packages/engine` — Lexer, Parser, Semantic Analyzer, IR Generator.
- **Renderer**: `packages/renderer` — ELK layout + SVG rendering.
- **Plugin TS**: `packages/plugin-ts` — TypeScript language plugin.
- **VS Code Extension**: `apps/vscode` — Live preview, diagnostics, autocomplete.
- **CLI**: `packages/cli` — Command-line diagram generation.
- **DSL Guide**: `docs/dsl-guide.md` — Authoritative syntax reference.

To validate generated UMLTS code, the engine can be invoked programmatically:

```typescript
import { UMLEngine } from '@umlts/engine'

const engine = new UMLEngine()
const result = engine.parse(umltSource)

if (result.diagnostics.length > 0) {
  // Handle errors
}
// result.diagram contains the IR
```
