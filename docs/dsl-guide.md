# 📘 UMLTS DSL Reference

UMLTS es un lenguaje de modelado textual para diagramas de clases UML 2.5.1. Su sintaxis es concisa e inspirada en TypeScript.

---

## 1. Léxico

### Palabras Clave

| Keyword      | Propósito                                  |
| :----------- | :----------------------------------------- |
| `class`      | Declara una clase                          |
| `interface`  | Declara una interfaz                       |
| `enum`       | Declara una enumeración                    |
| `package`    | Declara un paquete                         |
| `profile`    | Declara un perfil UML                      |
| `stereotype` | Declara un estereotipo dentro de un perfil |
| `note`       | Declara una nota flotante                  |
| `config`     | Bloque de configuración del diagrama       |
| `xor`        | Bloque de restricción XOR                  |

### Operadores de Relación

| Símbolo | Token                    | Semántica                    |
| :------ | :----------------------- | :--------------------------- |
| `>>`    | `OP_INHERIT`             | Herencia / Generalización    |
| `>I`    | `OP_IMPLEMENT`           | Implementación / Realización |
| `>*`    | `OP_COMP`                | Composición (navegable)      |
| `>*\|`  | `OP_COMP_NON_NAVIGABLE`  | Composición (no navegable)   |
| `>+`    | `OP_AGREG`               | Agregación (navegable)       |
| `>+\|`  | `OP_AGREG_NON_NAVIGABLE` | Agregación (no navegable)    |
| `><`    | `OP_ASSOC`               | Asociación unidireccional    |
| `<>`    | `OP_ASSOC_BIDIR`         | Asociación bidireccional     |
| `>-`    | `OP_USE`                 | Dependencia / Uso            |

### Modificadores

| Símbolo | Propósito           |
| :------ | :------------------ |
| `*`     | Abstracto           |
| `$`     | Estático            |
| `&`     | Activo (thread)     |
| `!`     | No heredable (leaf) |
| `^`     | Raíz de jerarquía   |

### Visibilidad

| Símbolo | UML        | Descripción |
| :------ | :--------- | :---------- |
| `+`     | público    | Por defecto |
| `-`     | privado    |             |
| `#`     | protegido  |             |
| `~`     | de paquete |             |

### Otros Símbolos

| Símbolo  | Token            | Uso                                     |
| :------- | :--------------- | :-------------------------------------- |
| `@`      | `AT`             | Aplicación de estereotipo / config line |
| `..`     | `RANGE`          | Ancla nota-entidad                      |
| `<>`     | `OP_ASSOC_BIDIR` | Clase de asociación / bifireccional     |
| `//`     | `COMMENT`        | Comentario de línea                     |
| `/* */`  | `COMMENT`        | Comentario de bloque                    |
| `/** */` | `DOC_COMMENT`    | Comentario de documentación             |

---

## 2. Organización del Código

### Paquetes

```text
package Core {
  class User
  package Security {
    class Token
  }
}
```

El namespace también puede expresarse con punto en la declaración de la entidad:

```text
class CRM.Models.Customer
```

> FQN (Fully Qualified Name) con `.` está soportado como nombre de entidad y como destino de relaciones.

---

## 3. Entidades

### Clases

```text
class Person
class *Animal              // abstracta con símbolo
class !FinalService        // no heredable
class ^BaseRoot            // raíz de jerarquía
class &ActiveWorker        // clase activa
```

Soporta parámetros de tipo genérico:

```text
class Repository<T>
class Pair<K, V>
```

### Interfaces

```text
interface Identifiable
interface Serializable<T>
```

### Enumeraciones

Forma en línea (valores separados por `|` o `,`):

```text
enum Status(ACTIVE | INACTIVE | PENDING)
enum Color(RED, GREEN, BLUE)
```

Forma de bloque:

```text
enum Direction {
  NORTH
  SOUTH
  EAST
  WEST
}
```

### Aplicación de Estereotipos en Entidades

Los estereotipos se aplican con `@Name` **antes** de la entidad o relación. Pueden apilarse:

```text
@entity
class User { ... }

@service @singleton
class OrderService { ... }

@deprecated
LegacyUser >> User
```

> **Los tagged values NO van inline junto al `@`.**
> Van en el tercer compartimento `[ ]` dentro del cuerpo de la entidad (ver sección 4 — Metadata).

---

## 4. Miembros

El orden de tokens para un miembro es:

```
[docs] [visibilidad] [modificadores] nombre [( params )] : [operador_relación] [modificadores_target] Tipo [multiplicidad] [= valorDefecto] [restricciones] [notas]
```

### Visibilidad

La visibilidad por defecto es **`+` (pública)**. Solo se declara cuando es diferente.

### Atributos

```text
class User {
  id: String
  -password: String
  $count: Integer = 0
  *template: String
  email: String {readOnly, unique}
  tags: String[0..*]
  members: User[1..*]
  score: Integer = 100
  birthday: Date "fecha de nacimiento"
}
```

### Métodos

```text
interface AuthService {
  +login(username: String, password: String): Boolean
  #validate(token: String)
  $getInstance(): AuthService
  *process()
}
```

### Parámetros

Los parámetros siguen la misma sintaxis de sufijo que los atributos:

```text
process(items: String[], config: >- Config)
```

### Documentación (Doc-Comments)

```text
class User {
  /** El identificador único del usuario */
  id: String

  /** @deprecated Usar newLogin() en su lugar */
  -login(): Boolean
}
```

### Metadata de Entidad (Tagged Values en Cuerpo)

Dentro del cuerpo de una clase o interfaz, se puede incluir un bloque metadata:

```text
class User {
  id: String
  [table="users", schema="public"]
}
```

---

## 5. Tipos

### Tipos Simples

```text
name: String
count: Integer
active: Boolean
data: User
```

### Tipos Genéricos

```text
items: List<String>
map: Map<String, User>
repo: Repository<Order>
```

### Tipos Opcionales

```text
nickname: String[0..1]
```

### Tipos XOR (Unión en tipo de atributo)

Define una restricción de exclusividad lógica para un atributo, obligando a que pertenezca a uno (y solo uno) de _N_ tipos posibles (donde N >= 2).

```text
result: xor { Success | Failure | Pending }
```

### Tipos Enum Inline

Define un enum anónimo directamente en el tipo del atributo:

```text
class Document {
  state: State(DRAFT | REVIEW | PUBLISHED)
}
```

---

## 6. Relaciones

### En Cabecera de Entidad

Define las relaciones directamente en la declaración:

```text
class Hero >> Character >I IFighter
class AdminUser >> User >I IAdmin >I IAuditable
interface ISortable >> IComparable<String>
```

### En Línea (Atributo)

El operador de relación va **antes** del tipo:

```text
class Car {
  engine: >* Engine          // Composición
  owner: >< Person           // Asociación unidireccional
  passengers: >+ Person[]    // Agregación, múltiple
  handler: >- IEventHandler  // Uso/Dependencia
}
```

### Declaración Externa (Suelta)

Forma más explícita para relaciones entre entidades ya definidas. Soporta multiplicidades en ambos extremos y encadenamiento:

```text
User [0..*] >< Role [1]
Order >> BaseEntity >I ITimestamped
Department >* Employee [1..*] >> Person
```

Con etiqueta:

```text
User [1] >< Group [*] "pertenece a"
```

Con bloque de miembros o restricciones:

```text
User [0..*] >< Role [1] {
  assignedAt: Date
  {ordered}
}
```

Con estereotipo aplicado:

```text
@deprecated
LegacyUser >> User
```

### No Navegabilidad

Agrega `|` al operador para indicar que la relación no es navegable desde el origen:

```text
class Engine {
  vehicle: >*| Vehicle   // Composición no navegable
  owner: >+| Person      // Agregación no navegable
}
```

---

## 7. Multiplicidad

| Sintaxis | Semántica             |
| :------- | :-------------------- |
| `[n]`    | Exactamente n         |
| `[n..m]` | Rango de n a m        |
| `[*]`    | Cero o más (`0..*`)   |
| `[1..*]` | Uno o más             |
| `[0..1]` | Cero o uno (opcional) |

Se puede poner sobre el tipo (`Type[1..*]`) o en declaraciones externas (`Source [1] >> Target`).

---

## 8. Clases de Asociación

Vincula dos entidades con una clase intermedia que posee atributos propios:

```text
class Assignment <> (User[1], Task[*]) {
  assignedAt: Date
  role: String
}
```

---

## 9. Notas

### Nota Flotante

```text
note "Todo usuario debe tener email verificado" as N1
```

### Ancla Nota-Entidad

```text
N1 .. User
N1 .. User, Role
```

---

## 10. Restricciones

### Inline en Miembro/Relación

```text
id: String {readOnly, unique}
User [0..*] >< Role [1] {ordered}
```

### Bloque XOR Global

Modela exclusividad lógica entre relaciones conjuntas. Si varias entidades convergen (o divergen) indicando restricción `xor`, significa que durante la ejecución o diseño solo una de esas relaciones será instanciada temporal o estructuralmente simultáneamente. Soporta de 2 a _N_ asociaciones (N >= 2).

```text
xor {
  Order >< CreditCard
  Order >< PayPal
  Order >< BankTransfer
}
```

---

## 11. Perfiles y Estereotipos

### Definición de Perfil

Un `profile` agrupa definiciones de `stereotype`. Cada estereotipo extiende una metaclase UML con `>>` y declara sus tagged values:

```text
profile Backend {
  stereotype Entity >> class {
    table: String
    schema: String = "public"
  }

  stereotype Service >> class {
    transactional: Boolean = false
  }

  stereotype Column >> property {
    columnName: String
    nullable: Boolean = true
  }

  stereotype ManyToMany >> association {
    fetch: String = "lazy"
  }
}
```

Metaclases válidas (términos UML canónicos): `class`, `interface`, `enum`, `package`, `property`, `operation`, `association`.

### Aplicación de Estereotipos

Los estereotipos se aplican con `@Name` antes de la declaración. Los tagged values van **siempre** en el bloque `[ ]` del cuerpo de la entidad:

```text
@Entity
class Order {
  id: String
  total: Float
  [ table="orders", schema="public" ]
}
```

Múltiples estereotipos y tagged values a nivel de miembro:

```text
@Entity
class User {
  @Column
  id: String

  @Column
  email: String

  [ table="users" ]
}
```

Aplicación sobre una relación:

```text
@ManyToMany
User [*] <> Role [*]
```

---

## 12. Configuración

### Bloque `config`

```text
config {
  defaultVisibility: public
  direction: "top-bottom"
  showPackages: true
  fontSize: 14
}
```

### Línea `@key: value`

Atajo de una sola opción:

```text
@direction: "left-right"
@showTypes: true
```

---

## 13. Comentarios

```text
// Comentario de línea

/*
  Comentario
  de bloque
*/

/**
 * Doc-comment vinculado al siguiente elemento
 */
class MyEntity { ... }
```

---

_Esta guía documenta UMLTS v0.9. Para detalles de arquitectura interna del motor, consulta `engine-architecture.md`._
