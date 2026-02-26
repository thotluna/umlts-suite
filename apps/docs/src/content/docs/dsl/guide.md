---
title: 'Guía del Lenguaje UMLTS'
description: 'Aprenda a dominar el DSL de UMLTS desde la sintaxis hasta el modelo de datos final.'
---

UMLTS está diseñado para ser expresivo y flexible. Esta guía te enseñará no solo cómo escribir el código, sino cómo el motor interpreta tus diseños.

---

## 1. Organización y Espacios de Nombres

### Paquetes (Packages)

Los paquetes son contenedores lógicos que agrupan entidades. En UMLTS, existen dos formas de trabajar con la organización.

#### Declaración Estructural (Bloque)

Es la forma recomendada para definir el contenido de un módulo de forma clara.

```typescript
package "Facturación" {
  class Factura {
    id: string
  }
}
```

```umlts
package Facturacion {
  class Factura {
    id: String
  }
}
```

#### Referencia mediante FQN (Sintaxis Corta)

No siempre necesitas envolver todo en bloques. Puedes declarar o referenciar entidades usando su nombre cualificado (Fully Qualified Name).

```typescript
// Referencia corta a una clase en otro paquete
facturacion.Factura <> Cliente
```

```umlts
class facturacion.Factura {
  id: String
}

```

> [!TIP]
> **Detrás de escena (IR)**: El motor resuelve automáticamente las rutas. En la IR, recibirás un objeto `IREntity` con la propiedad `namespace: ["Facturación"]`, facilitando la agrupación visual en el renderizador.

---

## 2. Declaración de Relaciones

Una de las mayores potencias de UMLTS es la flexibilidad para declarar cómo se conectan los elementos.

### Estilo "Global" (Fuera de la entidad)

Ideal para diagramas de visión general o cuando quieres separar la estructura de la lógica de conexión.

#### Resultado Visual

```umlts
class Motor
class Coche
Coche >+ Motor
```

### Estilo "In-line" (Dentro de la entidad)

Inspirado en cómo definimos tipos en TypeScript. Es mucho más rápido para bocetar arquitecturas mientras defines los miembros.

```typescript
class Coche {
  modelo: string

  // Declaración corta: 'Coche' es el origen automático
  >+ Motor
}
```

#### Resultado Visual

```umlts
class Coche {
  modelo: string
  >+ Motor
}
```

---

## 3. Miembros y Visibilidad

UMLTS soporta la visibilidad estándar de UML de forma intuitiva.

| Símbolo | Visibilidad | Descripción                         |
| :------ | :---------- | :---------------------------------- |
| `+`     | Public      | Accesible por todos (por defecto).  |
| `-`     | Private     | Solo accesible internamente.        |
| `#`     | Protected   | Accesible por herederos.            |
| `~`     | Package     | Accesible dentro del mismo paquete. |

#### Resultado Visual

```umlts
class SecurityManager {
  - secretKey: string
  + login(): boolean
  # validate(): boolean
}
```

---

## 4. De Código a Diagrama (Caso Real)

Supongamos que queremos modelar un sistema de pagos:

#### Resultado Visual

```umlts
package Pagos {
  abstract class MetodoPago {
    + procesar(): void
  }

  class Tarjeta >> MetodoPago {
    - numero: string
  }
}

class Usuario {
  - email: string
  -> "1..*" Pagos.MetodoPago
}
```

### ¿Qué recibes como programador?

Al usar `@umlts/engine`, el objeto `IRDiagram` contendrá:

1. **Entidades**: Tres nodos (`MetodoPago`, `Tarjeta`, `Usuario`).
2. **Jerarquía**: `Tarjeta` tendrá un `parent` apuntando al ID de `MetodoPago`.
3. **Relación**: Un vínculo de asociación desde `Usuario` hacia el FQN `Pagos.MetodoPago` con multiplicidad `1..*`.

### Resultado Visual

El renderizador generará automáticamente un bloque para el paquete "Pagos", meterá las dos clases dentro, y dibujará una flecha de asociación desde el exterior (Usuario) hacia la clase abstracta interior.
