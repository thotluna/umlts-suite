# Requerimientos: Sistema de Restricciones (Constraints) UML 2.5.1

Este documento detalla los requerimientos funcionales y semánticos para la evolución del sistema de restricciones en el motor UMLTS, con el objetivo de cumplir con el estándar UML 2.5.1 y proporcionar una validación robusta en el DSL.

## 1. Resolución y Validación de Objetos (Targets)

Las restricciones deben dejar de ser simples metadatos textuales para convertirse en elementos conectados al modelo.

- **RQ 1.1: Resolución de FQN**: El motor debe resolver los identificadores dentro de una restricción (targets) contra la Tabla de Símbolos.
- **RQ 1.2: Validación de Existencia**: Se debe reportar un error semántico si un objetivo de una restricción no existe o no es visible desde el contexto de la declaración.
- **RQ 1.3: Tipado de Targets**: Algunas restricciones solo son válidas para ciertos elementos (ej: `{subset}` solo para asociaciones/propiedades). El sistema debe validar que el tipo de elemento apuntado sea compatible con la restricción aplicada.

## 2. Reglas Semánticas por Tipo de Restricción

El sistema debe permitir tanto las restricciones estándar como las definidas por el usuario.

### 0. Restricciones de Usuario (User-Defined)

- **RQ 2.0.1: Extensibilidad**: El sistema debe permitir cualquier texto arbitrario dentro de las llaves `{ ... }` como una restricción válida.
- **RQ 2.0.2: Agnosticismo de Lenguaje**: Se debe soportar lenguaje natural, lenguajes de programación (TS/JS) u OCL. El motor preservará el texto de forma opaca si no coincide con una restricción estándar.

### 2.1 Restricción XOR (`{xor}`)

- **RQ 2.1.1: Consistencia de Extremos**: Todas las relaciones afectadas por un XOR deben compartir al menos un Clasificador común (origen o destino).
- **RQ 2.1.2: Exclusividad**: No se puede aplicar XOR a elementos de tipos incompatibles.

### 2.2 Re-definición y Sub-conjuntos (`{redefines}`, `{subset}`)

- **RQ 2.2.1: Compatibilidad de Tipos**: En un `{subset}`, el tipo debe ser compatible con el original.
- **RQ 2.2.2: Transmisión de Multiplicidad**: La multiplicidad resultante debe ser igual o más restrictiva.

### 2.3 Restricciones de Colección (`{ordered}`, `{unique}`)

- **RQ 2.3.1: Aplicabilidad**: Solo aplicable a colecciones (`upper > 1`).
- **RQ 2.3.2: Sincronización**: Los flags deben reflejar fielmente la semántica de la restricción en la IR.

## 3. Contexto y Ámbito (Scoping)

- **RQ 3.1: Restricciones In-line**: Aplicadas automáticamente a la relación generada por el miembro.
- **RQ 3.2: Invariantes de Clase**: Referencia a miembros internos o heredados.
- **RQ 3.3: Restricciones Externas/Globales**: Definidas fuera de los bloques de entidad para coordinar múltiples elementos.

## 4. Requerimientos de Expresión y Análisis

- **RQ 4.1: Validación de Símbolos**: Si el motor detecta una expresión técnica, debe intentar validar que los símbolos (atributos/métodos) existan en el contexto.
- **RQ 4.2: Inmutabilidad**: Reconocimiento de `{readOnly}` o `{frozen}` como modificadores de estado.

## 5. Representación Intermedia (IR) y Visualización

- **RQ 5.1: Agrupación Estructural**: La IR debe vincular los elementos afectados bajo un ID de restricción común.
- **RQ 5.2: Trazabilidad Espacial**: Los metadatos deben incluir la ubicación exacta de todos los anclajes de la restricción.
- **RQ 5.3: Representación mediante Notas**:
  - El renderer debe soportar el símbolo de **Nota** (rectángulo plegado).
  - El estereotipo `«constraint»` en una nota vinculada debe ser tratado como una restricción formal.
- **RQ 5.4: Trayectorias Discontinuas**: Soporte para líneas punteadas entre la nota/etiqueta y los elementos restringidos.

## 6. Tareas de Definición por Elemento (Roadmap)

Este desglose identifica las capacidades que deben añadirse al DSL y al Motor para soportar restricciones y notas elemento por elemento.

### 6.1 Restricciones (Semántica y Reglas)

| Elemento              | Tipo de Restricción      | Tarea DSL / Motor                                                                          |
| :-------------------- | :----------------------- | :----------------------------------------------------------------------------------------- |
| **Clase / Interface** | Invariante de Estado     | Soportar bloques `{...}` en el compartimento de la clase que referencien miembros locales. |
| **Atributo**          | Metadata de Colección    | Validar `{ordered}` y `{unique}` contra la multiplicidad y tipo de dato.                   |
| **Atributo**          | Regla de Valor           | Soportar validación de expresiones tipo `{ edad >= 18 }`.                                  |
| **Método**            | Pre/Post-condiciones     | Permitir adjuntar restricciones específicas al inicio/fin de la firma de un método.        |
| **Asociación**        | Jerarquía y Exclusividad | Implementar validadores para `{xor}`, `{subset}` y `{redefines}` entre relaciones.         |
| **Paquete**           | Reglas Globales          | Permitir declaraciones de restricciones independientes que referencien múltiples FQNs.     |

### 6.2 Notas (Documentación Visual)

| Elemento             | Funcionalidad      | Tarea DSL / Motor                                                                                  |
| :------------------- | :----------------- | :------------------------------------------------------------------------------------------------- |
| **Elemento General** | Nota Independiente | Crear palabra clave `note` para definir bloques de texto libre.                                    |
| **Elemento General** | Anclaje (Link)     | Implementar sintaxis de conexión (ej: `N1 .. Clase`) para vincular notas visualmente.              |
| **Varios Elementos** | Nota Compartida    | Permitir que una sola nota se ancle a múltiples elementos mediante líneas discontinuas.            |
| **Cualquier Nota**   | Estereotipado      | Soportar `«constraint»` dentro de la nota para elevar su valor de comentario a restricción formal. |

## 7. Identificación del Gap Actual

Para completar estas tareas, se han detectado los siguientes faltantes técnicos en el sistema actual:

1.  **Gramática Limitada**: El parser actual solo reconoce `{xor}` y comentarios de código `//`, pero no tiene nodos AST para `Note` o `Anclaje`.
2.  **Falta de Memoria de Relación**: El `ConstraintRegistry` guarda la restricción, pero no tiene una forma robusta de saber a qué relaciones exactas de la IR afecta si no son parte de un bloque explícito.
3.  **Visualización**: El motor de layout (ELK) y el generador de SVG no tienen implementado el símbolo de "Nota" ni el tipo de línea discontinua necesario para los anclajes.

## 8. Catálogo de Restricciones Estándar (UML 2.5.1)

Para garantizar una nomenclatura única en el DSL, el motor debe reconocer y validar las siguientes palabras clave reservadas.

### 8.1 Para Propiedades y Atributos (Structural Features)

| Keyword             | Función                                                            | Aplicación                         |
| :------------------ | :----------------------------------------------------------------- | :--------------------------------- |
| `{readOnly}`        | El valor es inmutable tras la creación.                            | Atributos, Ends de Asociación.     |
| `{ordered}`         | Los elementos de una colección mantienen un orden secuencial.      | Atributos con multiplicidad `> 1`. |
| `{unique}`          | No se permiten duplicados en la colección (por defecto es `true`). | Atributos con multiplicidad `> 1`. |
| `{id}`              | La propiedad forma parte de la clave de identidad de la instancia. | Atributos.                         |
| `{union}`           | La propiedad es una "unión derivada".                              | Atributos complejos.               |
| `{subset: name}`    | Indica que los valores son un subconjunto de `name`.               | Atributos y Relaciones.            |
| `{redefines: name}` | Reemplaza la definición de una propiedad heredada.                 | Atributos y Relaciones.            |
| `{derived}`         | Indica que el valor del atributo es calculado/derivado.            | Atributos.                         |

### 8.2 Para Jerarquías y Herencia (Generalization Sets)

Estas restricciones se aplican a grupos de flechas de herencia (`>>`).
| Keyword | Función |
| :--- | :--- |
| `{disjoint}` | Una instancia no puede pertenecer a más de una subclase del grupo. |
| `{overlapping}` | Una instancia puede pertenecer a múltiples subclases simultáneamente. |
| `{complete}` | Todas las instancias de la superclase deben pertenecer a alguna subclase. |
| `{incomplete}` | Pueden existir instancias de la superclase que no son de ninguna subclase. |

### 8.3 Para Relaciones y Estructuras (Associations & Types)

| Keyword            | Función                                                                            | Sintaxis DSL                     |
| :----------------- | :--------------------------------------------------------------------------------- | :------------------------------- |
| `{xor}`            | **Regla de Exclusividad**: Solo una de las relaciones/miembros puede estar activa. | `xor { r1, r2 }` o `{xor: a, b}` |
| **xor { T1, T2 }** | **Tipo de Unión (XOR Type)**: Define un miembro como elección excluyente.          | `pago: xor {CreditCard, Cash}`   |

### 8.4 Para Operaciones (Behavioral Features)

| Keyword       | Función                                                     |
| :------------ | :---------------------------------------------------------- |
| `{query}`     | La operación no modifica el estado del sistema.             |
| `{pre: exp}`  | Pre-condición: la expresión debe ser verdadera antes.       |
| `{post: exp}` | Post-condición: la expresión debe ser verdadera después.    |
| `{body: exp}` | Especifica el valor de retorno o la lógica de la operación. |

## 9. Requerimientos de Sintaxis Unificada (DSL)

- **RQ 9.1: Formato Unificado**: Todas las restricciones que requieran un parámetro (target o expresión) deben usar los dos puntos `:` como separador universal (ej: `{subset: target}`, `{pre: exp}`).
- **RQ 9.2: Composición**: El DSL debe permitir múltiples restricciones separadas por comas dentro del mismo bloque: `{readOnly, unique, ordered}`.
- **RQ 9.3: Estereotipos vs Restricciones**: El motor debe distinguir visualmente entre `«stereotypes»` (tipado) y `{constraints}` (lógica).
- **RQ 9.4: XOR Estructural**: El DSL debe permitir usar `xor { ... }` como un tipo de dato en la declaración de atributos para evitar múltiples nulos (Unión Discriminada).
- **RQ 9.5: Resolución Contextual**: Las restricciones declaradas en el cuerpo de una clase resuelven nombres de miembros locales automáticamente.
- **RQ 9.6: Extensiones por Plugin**: Palabras clave específicas de lenguajes (ej: `override`) se mapean a restricciones estándar en la IR sin contaminar el núcleo del motor.
- **RQ 9.7: Redefinición y Renombrado**: Soporte para `{redefines: target}` para permitir cambios de nombre conceptuales.
- **RQ 9.8: Encadenamiento**: Soporte para concatenar múltiples reglas en una sola línea de metadatos.
- **RQ 9.9: Expresiones Puras**: Si el texto dentro de las llaves no coincide con una palabra clave conocida, se trata como una **Invariante de Usuario** pura (ej: `{ saldo > 0 }`).
- **RQ 9.10: Atributos Derivados (No-Slash Policy)**: El motor identificará un atributo como derivado si contiene `{derived}` o `{body: ...}`. **No** se utilizará el prefijo `/` (estándar UML) para evitar conflictos con comentarios y caracteres de escape en el entorno de desarrollo.

### Ejemplo de Sintaxis Unificada Propuesta:

```umlts
class Vehiculo {
  motor: Motor
}

class Empresa {
  // 1. Uso de flags de colección encadenados
  // Por defecto en UML: {unique, unordered}
  empleadosLogueados: string[*] {ordered, unique, readOnly}

  // 2. Colección que permite duplicados (bolsa)
  puntos: number[*] {nonunique}
}

class Auto >> Vehiculo {
  // 3. Redefinición con cambio de nombre (UML puro)
  motorElectrico: MotorElectrico {redefines: motor}

  // 4. Redefinición con mismo nombre (Inferencia)
  // motor: MotorElectrico {redefines}

  // 5. Atributo Derivado (Sin símbolo / para evitar escapes)
  antiguedad: number {derived, body: DateTime.now().year - anioFabricacion}

  // 6. Uso de XOR como TIPO (Evita nulos)
  transmision: xor { Manual, Automatica }

  { precio > 0 } // Invariante local
}
```

## 10. Diferenciación de Comentarios y Notas

Para evitar ruido visual y ambigüedad, el motor distinguirá entre "Documentación del Script" y "Elementos del Diagrama".

| Tipo               | Sintaxis               | ¿Va al Diagrama? | ¿Genera Nodo?     | Propósito                                   |
| :----------------- | :--------------------- | :--------------- | :---------------- | :------------------------------------------ |
| **Script Comment** | `//` o `/* */`         | **NO**           | No                | Notas técnicas privadas del autor.          |
| **Doc Comment**    | `/** ... */`           | **OPCIONAL**     | No (Metadata)     | Tooltips o metadatos de exportación.        |
| **UML Note**       | `"Texto"` o `note: ""` | **SÍ**           | **SÍ (Elemento)** | Comunicación visual de diseño/arquitectura. |

### 10.1 Sintaxis de Nota Contextual (No-Keyword Policy)

Dentro de las clases e interfaces, se permite omitir la palabra `note` para mayor fluidez.

- **RQ 10.1: Nota de Entidad**: Una string sola al inicio del cuerpo de una clase se ancla a la cabecera de la entidad.
- **RQ 10.2: Nota de Miembro**: Una string al final de una declaración de atributo o método (después de tipos y restricciones) se ancla a ese miembro.
- **RQ 10.3: Prohibición de Concatenación**: No se permite la concatenación implícita de strings (`"A" "B"`). Esto garantiza que si el parser ve una string después de un valor por defecto, ésta sea interpretada como una nota.

### 11. Relación entre Notas y Restricciones (Anclajes Semánticos)

Las notas y restricciones pueden coexistir y vincularse para proporcionar mayor claridad técnica.

- **RQ 11.1: Anclaje a Restricción Nombrada**: Una nota global puede anclarse a una restricción que posea un alias (`as ID`).
- **RQ 11.2: Notas como Contenedores (Estereotipo)**: Si una nota comienza con el estereotipo `«constraint»`, se tratará visualmente como una regla lógica (formato bracket si el renderer lo soporta).
- **RQ 11.3: Anclaje de Nota a Relación de Restricción**: Las notas pueden anclarse a los símbolos de conexión de restricciones (ej. la línea de un XOR global).

### Ejemplo de Integración Final:

```umlts
package Logistica {
  note: "Módulo crítico de despacho" as N1

  class Camion {
    "Nota de clase: Solo vehículos habilitados"

    patente: string {unique} "ID fiscal del vehículo"
    capacidad: number = 2000 "Carga máxima en KG"

    +encender(): boolean "Lógica de ignición"
  }
}

// Relación explícita
xor { Camion -> DespachoLocal, Camion -> DespachoCargo } as X1
note "Regla de negocio: El camión solo puede estar en un despacho a la vez" as N2
N2 .. X1 // Anclaje de nota a la restricción
```
