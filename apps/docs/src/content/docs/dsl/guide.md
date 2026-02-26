---
title: Guía del Lenguaje UMLTS
description: Aprende a definir diagramas de clases UML de forma textual con una sintaxis inspirada en TypeScript.
---

UMLTS es un lenguaje de modelado ligero diseñado para definir diagramas de clases UML 2.5.1 de forma textual, con una sintaxis inspirada en TypeScript pero adaptada a las necesidades de diseño de software.

---

## 1. Organización del Código

### Paquetes (Packages)

Los paquetes permiten agrupar entidades y organizar el diagrama jerárquicamente.

```typescript
package "Sistema de Ventas" {
  class Cliente {
    id: string
  }
}
```

### Espacios de Nombres (FQN)

Puedes referenciar entidades fuera de su paquete usando puntos para denotar la ruta completa: `PaquetePadre.PaqueteHijo.Clase`.

---

## 2. Definición de Entidades

### Clases e Interfaces

Las clases son los bloques básicos de construcción. Las interfaces definen contratos.

```typescript
interface IIdentifiable {
  id: string
}

class Usuario >i IIdentifiable {
  username: string
  isActive: boolean
}
```

### Modificadores de Entidad

- `abstract`: Clase que no puede ser instanciada.
- `static`: Miembro que pertenece a la clase.

---

## 3. Miembros (Atributos y Operaciones)

### Atributos

```typescript
class Product {
  + name: string       // Público (default)
  - price: number      // Privado
  # stock: number      // Protegido
  readonly id: string  // Solo lectura
}
```

### Operaciones (Métodos)

```typescript
class MathUtils {
  static add(a: number, b: number): number
}
```

---

## 4. Relaciones

UMLTS soporta todas las relaciones estándar de UML mediante operadores intuitivos:

| Relación    | Operador | Descripción                   |
| :---------- | :------: | :---------------------------- |
| Herencia    |   `>>`   | Especialización de clase.     |
| Realización |   `>i`   | Implementación de interfaz.   |
| Composición |   `>+`   | Relación "Todo-Parte" fuerte. |
| Agregación  |   `>o`   | Relación "Todo-Parte" débil.  |
| Asociación  |   `->`   | Conexión simple entre clases. |
| Dependencia |   `>-`   | Uso temporal de una clase.    |

### Ejemplo de Relaciones

```typescript
Empresa >+ "*" Empleado
Empleado >> Gerente
```

---

## 5. Notas y Restricciones

### Notas

Las notas permiten añadir explicaciones textuales vinculadas a elementos.

```typescript
note "Este es un sistema altamente acoplado por diseño" as N1
N1 .. Motor
```

### Restricciones (Constraints)

```typescript
class Cuenta {
  balance: number { balance >= 0 }
}
```
