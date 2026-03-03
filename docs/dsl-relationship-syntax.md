# Especificación: Sintaxis de Relaciones en UMLTS

Este documento detalla la estructura unificada para la declaración de relaciones y dependencias en el DSL de UMLTS, siguiendo el modelo de "Extremo A - Vínculo - Extremo B" coherente con UML 2.5.1.

## 1. Patrón General de Sintaxis

La sintaxis del DSL organiza los tokens para que los metadatos se apliquen exactamente al elemento que califican, manteniendo siempre la visibilidad como modificador primario:

`[Visibilidad] Entidad [Meta]`

En el contexto de relaciones (Vínculo Universal), este patrón se aplica a cada participante:

`[Meta_Extremo_A] Operador [Meta_Vínculo] [Meta_Extremo_B]`

---

## 2. Mapa de Componentes: Herencia (Generalización)

| Origen (Subclase)                                      | Vínculo (Dependencia)                       | Final (Superclase) | Descripción                    |
| :----------------------------------------------------- | :------------------------------------------ | :----------------- | :----------------------------- |
| **Visibilidad**, Nombre, Modificadores (`*`, `!`, `^`) | Operador `>>`, Descriptor `'Set:PowerType'` | Nombre de Clase    | Jerarquía de tipos             |
| multi `[min..max]`                                     | Estereotipo `<<...>>`                       | multi `[min..max]` | Cardinalidad de generalización |
| -                                                      | Restricciones `{complete, disjoint}`        | -                  | Semántica de conjunto          |

## 3. Mapa de Componentes: Implementación (Realize)

| Origen (Clase)          | Vínculo (Dependencia)                  | Final (Interfaz)   | Descripción              |
| :---------------------- | :------------------------------------- | :----------------- | :----------------------- |
| **Visibilidad**, Nombre | Operador `>I`, Descriptor `'MapperID'` | Nombre de Interfaz | Cumplimiento de contrato |
| multi `[min..max]`      | Estereotipo `<<realize>>`              | -                  | -                        |
| -                       | Restricciones `{partial, abstract}`    | -                  | Lógica de implementación |

## 4. Mapa de Componentes: Asociación (`><`)

| Origen (Extremo A)                       | Vínculo (Dependencia)          | Final (Extremo B)             | Descripción                       |
| :--------------------------------------- | :----------------------------- | :---------------------------- | :-------------------------------- |
| **Visibilidad**, Entidad, Nombre Miembro | Operador `><`, Nombre Relación | **Visibilidad**, Entidad, Rol | Vínculo estructural bidireccional |
| Multiplicidad `[]`                       | Estereotipo `<<...>>`          | Multiplicidad `[]`            | Cuantificación                    |
| Restricciones `{}`                       | Restricciones `{}`             | Restricciones `{}`            | Invariantes                       |

## 5. Mapa de Componentes: Agregación (`>+`) y Composición (`>*`)

| Origen (Todo)                            | Vínculo (Dependencia) | Final (Parte)                 | Descripción                     |
| :--------------------------------------- | :-------------------- | :---------------------------- | :------------------------------ |
| **Visibilidad**, Entidad, Nombre Miembro | Operador `>+` o `>*`  | **Visibilidad**, Entidad, Rol | Propiedad (Shared vs Composite) |
| Multiplicidad `[]`                       | Restricción Vínculo   | Multiplicidad `[]`            | Vida dependiente                |
| Restricciones `{}`                       | Estereotipo `<<...>>` | Restricciones `{}`            | Invariantes de existencia       |

## 6. Mapa de Componentes: Dependencia de Uso (`>-`)

| Origen (Cliente)         | Vínculo (Dependencia)           | Final (Proveedor)             | Descripción                |
| :----------------------- | :------------------------------ | :---------------------------- | :------------------------- |
| **Visibilidad**, Entidad | Operador `>-`, Nombre Uso       | **Visibilidad**, Entidad, Rol | Relación de uso momentánea |
| -                        | Estereotipo `<<use>>, <<call>>` | Multiplicidad `[]`            | Semántica de interacción   |
| -                        | Restricciones `{...}`           | Restricciones `{}`            | -                          |

## 7. Mapa de Componentes: Exclusión Polimórfica (XOR)

| Origen (Extremo A)              | Vínculo (Dependencia)       | Final (Bloque XOR)           | Descripción                     |
| :------------------------------ | :-------------------------- | :--------------------------- | :------------------------------ |
| **Visibilidad**, Nombre Miembro | Operador (`><`, `>*`, etc.) | Identidad de Rama (Clase)    | Exclusión mutua de destinos     |
| -                               | Palabra clave `xor`         | **Visibilidad**, Rol `'...'` | -                               |
| -                               | -                           | Estereotipo, Restricción     | Metadatos individuales por rama |
| -                               | -                           | Multiplicidad `[min..max]`   | Cardinalidad específica         |

## 8. Mapa de Componentes: Clase de Asociación (`<>`)

| Entidad (Clase / Nexo)            | Vínculo (Conector) | Finales (Participantes)    | Descripción                    |
| :-------------------------------- | :----------------- | :------------------------- | :----------------------------- |
| **Visibilidad**, Nombre           | Operador `<>`      | **Visibilidad**, Entidad   | Identidad dual Clase + Vínculo |
| Estereotipos unificados `<<...>>` | -                  | Rol `'...'`                | -                              |
| Restricciones unificadas `{...}`  | -                  | Restricción, Estereotipo   | Metadatos de cada extremo      |
| **Cuerpo `{...}`**                | -                  | Multiplicidad `[min..max]` | Miembros del nexo              |

## 9. Mapa de Componentes: Asociación N-aria (Diamond)

| Origen (Identidad Nexo)  | Vínculo (Centro) | Participantes (Extremos)   | Descripción            |
| :----------------------- | :--------------- | :------------------------- | :--------------------- |
| **Etiqueta** (`'Label'`) | Operador `<>`    | **Visibilidad**, Entidad   | Conexión multicéntrica |
| Estereotipos globales    | -                | Rol `'...'`                | -                      |
| Restricciones globales   | -                | Estereotipo, Restricción   | Metadatos por rama     |
| -                        | -                | Multiplicidad `[min..max]` | Cardinalidad por rama  |

---

## 10. Arquitectura de Transformación: Del Lexer al IR

La implementación de esta sintaxis requiere un linaje técnico coherente desde la captura de tokens hasta la Representación Intermedia (IR).

### 10.1 Representación Intermedia (IR: Modelo de Vínculo Multicéntrico)

Para asegurar la compatibilidad con **XMI (UML 2.5.1)** y permitir un tipado fuerte en el motor, el IR se estructura en tres niveles de objetos densos:

#### A. IREntityRef (Referencia Tipada)

Evita el uso de strings ciegos para los tipos. Captura la identidad y naturaleza del clasificador.

```typescript
export interface IREntityRef {
  id: string // FQN (Identidad única: 'core.User')
  kind: IREntityType // Metatipo: CLASS | INTERFACE | DATA_TYPE
  label: string // Nombre visual
  typeArguments?: IREntityRef[] // Soporte para genéricos (List<T>)
}
```

#### B. IRRelationshipEnd (El Participante/Extremo)

Objeto que encapsula la "mochila técnica" de cada final de la relación. Mapea 1:1 con un `Property` de UML.

```typescript
export interface IRRelationshipEnd {
  type: IREntityRef // Referencia Tipada obligatoria
  role?: string // Nombre del final (Rol)
  visibility: IRVisibility // + - # ~
  multiplicity: IRMultiplicity
  aggregation: IRAggregationKind // none | shared | composite
  isNavigable: boolean
  stereotypes?: IRStereotypeApplication[]
  constraints?: IRConstraint[]
}
```

#### C. IRRelationship (El Vínculo Universal)

Objeto central que unifica el origen con sus posibles destinos.

```typescript
export interface IRRelationship {
  kind: IRRelationshipType // Herencia | Asociación | etc.
  label?: string // Etiqueta del nexo ('SupplyChain')
  origin: IRRelationshipEnd // Siempre tipado
  targets: IRRelationshipEnd[] // [1] para binarias, [N] para XOR/N-arias
  associationClassId?: string // Bicefalía opcional
  stereotypes?: IRStereotypeApplication[]
  constraints?: IRConstraint[]
}
```

Esto garantiza que una asociación binaria, un bloque XOR o una relación N-aria sean procesados por la misma lógica de grafos, permitiendo que el Renderer y el Serializador XMI funcionen de forma recursiva y predecible.

---

_Documentación generada para la suite UMLTS - Arquitectura Senior._
