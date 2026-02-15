---
name: class-diagram-specialist
description: Expert in UML class diagrams and the UMLTS DSL. Specializes in translating requirements into grammar-compliant scripts, with a strong preference for in-line declarations and proper relationship semantics.
---

# Class Diagram Specialist

This skill provides expert knowledge for creating, refining, and debugging UML class diagrams using the UMLTS DSL.

## When to Use This Skill

Use this skill when:

- Designing systems and modules through UMLTS scripts.
- Translating complex relationships into concise DSL code.
- Ensuring diagrams strictly follow the UML inheritance and association semantics.
- Optimizing script readability using in-line declarations.

## UMLTS DSL Core Principles

### 1. In-Line Declaration Priority

Prefer declaring relationships inside the entity scopes (header or members) to keep the script organized by component.

#### Header Relations (In-line)

- **Inheritance**: Only single inheritance is allowed using `>>`.
- **Implementation**: Multiple interfaces are allowed by chaining `>I` operators. No commas.

```umlts
class MyClass >> Parent >I IAuth >I IService { ... }
```

#### Member Relations (In-line)

Reference relationships directly as the type of an attribute.

```umlts
class Moto {
  - motor: >* MotorX
}
```

### 2. Relationship Symbols & Semantics

| Symbol | Keyword Alias | UML Meaning                                       |
| :----- | :------------ | :------------------------------------------------ |
| `>>`   | `>extends`    | **Inheritance** (Single only)                     |
| `>I`   | `>implements` | **Implementation** (Multiple allowed by chaining) |
| `>*`   | `>comp`       | **Composition** (Strong ownership)                |
| `>+`   | `>agreg`      | **Aggregation** (Weak ownership)                  |
| `>-`   | `>use`        | **Dependency** (Usage)                            |
| `><`   | `>assoc`      | **Association** (Connection)                      |
| `<>`   | `>bidir`      | **Bidirectional Association** (Mutual connection) |

### 3. Qualified Names (FQN) & Generics

Use dots for namespaces and brackets for generics. The engine is optimized to handle these even in complex nested forms.

```umlts
class Domain.Service >I Base.IRepository<Domain.Entity>
```

### 4. Modifiers

- `+`: Public (Use for methods/attributes).
- `-`: Private (Use for internal state).
- `#`: Protected.
- `~`: Internal.
- `$`: Static member or class. Use `$class Name` or `class $ Name`.
- `*`: Abstract member (prefix: `*method()`) or entity. Use `*class Name` or `*interface Name`. Also used in relationships (`>> *Target`) to mark the target as abstract.
- `&`: Active class (prefix: `&class Name` or `class & Name`) or the `active` reserved word. Draw double vertical borders.

#### Modifier Flexibility

Modifiers like `*`, `$`, and `&` can appear **before or after** the entity keyword and identifiers, with or without spaces.

```umlts
*class AbstractClass
class * AbstractClass
$class StaticClass
&class ActiveClass
active class ActiveClass
```

### 5. Signature Minimalism

Methods can omit the return type. Abstract methods use the `*` prefix.

```umlts
class Example {
    + action()
    *abstractAction()
}
```

## Best Practices

1. **Avoid External Redundancy**: If a relationship is declared in-line, do not repeat it as an external declaration unless you need specific formatting (like labels or custom multiplicities not supported in-line).
2. **Semantic Distinction**: Use `>*` for strong ownership (Composition), `>+` for weak ownership (Aggregation), `>-` for usage dependencies, `><` for standard associations, and `<>` for mutual knowledge.
3. **Restricted Symbols**: The single `>` symbol is not allowed alone.
4. **Dependency in Methods**: Use `>-` in method parameters to indicate that a class depends on another for a specific operation.
5. **Package Organization**: Group related entities within `package { ... }` blocks to help the layout engine organize hierarchy properly.
