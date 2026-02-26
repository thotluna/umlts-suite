# 📘 Guía del Lenguaje UMLTS (DSL)

UMLTS es un lenguaje de modelado ligero diseñado para definir diagramas de clases UML 2.5.1 de forma textual, con una sintaxis inspirada en TypeScript pero adaptada a las necesidades de diseño de software.

---

## 1. Organización del Código

### Paquetes (Packages)

Los paquetes permiten agrupar entidades y pueden anidarse.

- **Declaración por Bloque (Larga):** Ideal para agrupar múltiples elementos.

  ```text
  package Core {
    class User
    package Security {
      class Token
    }
  }
  ```

- **Declaración por Punto (En línea):** Ideal para definiciones rápidas o jerarquías profundas.
  ```text
  class CRM.Models.Customer
  ```

---

## 2. Entidades Principales

### Clases, Interfaces y Enums

Se definen con su palabra clave y un nombre.

```text
class Person
interface Identifiable
enum Status(ACTIVE | INACTIVE)
```

- **Modificadores de Entidad:**
  - `*` o `abstract`: Define una clase abstracta.
  - `!` o `leaf`: Define una clase que no puede ser heredada.
  - `^` o `root`: Define una clase raíz en la jerarquía.

**Ejemplo:** `class *Animal` (Clase Animal abstracta).

---

## 3. Miembros de Entidad

Cada entidad puede tener atributos y métodos. La visibilidad por defecto es **Pública (`+`)**.

### Visibilidad

| Símbolo | Palabra Clave | Significado     |
| :------ | :------------ | :-------------- |
| `+`     | `public`      | Público         |
| `-`     | `private`     | Privado         |
| `#`     | `protected`   | Protegido       |
| `~`     | `internal`    | Paquete/Interno |

### Atributos

- **Sintaxis:** `[visibilidad] nombre: [relación] Tipo [multiplicidad] [= valorDefecto] [{restricciones}] ["nota"]`

```text
class User {
  id: string
  -password: string
}
```

### Métodos

- **Sintaxis:** `[visibilidad] nombre(params): Tipo`

```text
interface AuthService {
  +login(u: string, p: string): boolean
}
```

### Modificadores de Miembro

- `$` o `static`: Miembro estático.
  - Ejemplo: `$count: int`
- `*` o `abstract`: Miembro abstracto (solo en clases abstractas o interfaces).

---

## 4. Sistema de Relaciones

UMLTS utiliza el prefijo `>` para identificar la intención de una relación.

| Tipo                    | Símbolo | Palabra Clave | UML                            |
| :---------------------- | :------ | :------------ | :----------------------------- |
| **Herencia**            | `>>`    | `>extends`    | Generalización                 |
| **Implementación**      | `>I`    | `>implements` | Realización                    |
| **Composición**         | `>*`    | `>comp`       | Composición (Diamante Relleno) |
| **Agregación**          | `>+`    | `>agreg`      | Agregación (Diamante Vacío)    |
| **Asociación**          | `>-`    | `>asoc`       | Asociación (Flecha)            |
| **Asoc. Bidireccional** | `<>`    | N/A           | Doble Flecha                   |

### Declaración de Relaciones

Existen tres formas de declarar una relación:

1.  **En Cabecera (Herencia/Implementación):**

    ```text
    class Hero >> Character >I IFighter
    ```

2.  **En Línea (Inline - Atributos):**
    Define la relación directamente como el tipo de un atributo.

    ```text
    class Car {
      engine: >* Engine  // Car tiene un Engine (Composición)
      owner: >- Person   // Car conoce a un Person (Asociación)
    }
    ```

3.  **Declaración Externa (Suelta):**
    Útil para diagramar relaciones sin modificar las entidades o para múltiples relaciones.
    ```text
    User [0..*] >- [1] Role
    ```

---

## 5. Multiplicidad (Cardinalidad)

Se define entre corchetes `[]` después del tipo de dato.

- `[n]`: Exactamente _n_.
- `[n..m]`: Rango (ej: `[1..5]`).
- `[*]`: Muchos.
- `[]`: Atajo para `[0..*]`.

**Ejemplo:** `members: User[1..*]` o `tags: string[]`.

---

## 6. Elementos Avanzados

### Enums Inline

Puedes definir un enum en el mismo lugar donde lo usas.

```text
class Document {
  state: State(DRAFT | REVIEW | PUBLISHED)
}
```

### Clases de Asociación

Vinculan dos entidades con una entidad intermedia que tiene sus propios atributos.

```text
class Assignment <> (User[1], Task[*]) {
  assignedAt: Date
}
```

### Bloques XOR

Representan exclusividad lógica entre relaciones.

```text
xor {
  Order >- CreditCard
  Order >- PayPal
}
```

### Notas y Restricciones

- **Notas:** `//` para línea, `/* */` para bloque.
- **Restricciones:** Entre llaves `{}`.
  - Ejemplo: `-id: string {readOnly, unique}`
- **Anclajes de Notas:** Con el operador `..`.
  ```text
  note "Todo usuario debe estar validado" as N1
  N1 .. User
  ```

---

_Esta guía resume la nomenclatura de UMLTS v0.8. Para detalles sobre la arquitectura del motor y el pipeline, consulta `arquitectura.md`._
