# 📑 Especificación Técnica: UMLTS v0.8

Este documento es la referencia oficial para el lenguaje de modelado de clases **UMLTS**.

## 1. Estructuras de Datos (Entidades)
El lenguaje reconoce tres contenedores principales:
* `class`: Define una clase con estado y comportamiento.
* `interface`: Define un contrato o interfaz.
    * **1. Definición**: Se declara la entidad y sus miembros. Solo soporta herencia (`>>` o `>extends`) de otras interfaces.
        * *Ejemplo*: `interface IVolador >> ISerVivo { + volar(): void }`
    * **2. Implementación (Uso)**: Una clase utiliza la interfaz como un contrato usando el iniciador de relación `>I` o `>implements`.
        * *Ejemplo*: `class Heroe >I IVolador`
* `enum`: Define un conjunto de constantes o catálogo de opciones.

## 2. Métodos y Firmas
Los métodos se identifican por el uso de paréntesis `()`. Siguen el estándar de tipado del lenguaje.
* **Sintaxis**: `visibilidad nombre(param: Tipo): Retorno`
* **Ejemplo**: `+ atacar(enemigo: Monstruo, potencia: int): void`

## 3. Modificadores de Visibilidad
La visibilidad es **opcional**. Si no se especifica, el sistema asume que el miembro es **Público (`+`)**. Se basa en un sistema de normalización que acepta tanto símbolos como palabras clave:

| Visibilidad | Símbolo | Palabra Clave | Significado UML |
| :--- | :--- | :--- | :--- |
| **Público** | `+` *(Default)* | `public` | Miembro accesible para todos. |
| **Privado** | `-` | `private` | Miembro accesible solo en la clase. |
| **Protegido** | `#` | `protected` | Miembro accesible en la clase y herederos. |
| **Paquete** | `~` | `internal` | Miembro accesible dentro del mismo paquete. |

*   **Ejemplo**: `fuerza: int` es equivalente a `+ fuerza: int` y a `public fuerza: int`.

## 4. Sistema de Relaciones (Iniciador `>`)
Todas las relaciones deben estar precedidas por el carácter de intención `>`. Este símbolo actúa como un puntero visual que facilita la lectura y evita la necesidad de escapar caracteres especiales. Se pueden usar símbolos o palabras clave.

| Tipo de Relación | Símbolos | Palabras Clave | Significado UML |
| :--- | :--- | :--- | :--- |
| **Herencia** | `>>` | `>extends` | Generalización (Sólida + Triángulo) |
| **Implementación** | `>I` | `>implements` | Realización (Punteada + Triángulo) |
| **Composición** | `>*` | `>comp` | Composición (Sólida + Diamante Relleno) |
| **Agregación** | `>+` | `>agreg` | Agregación (Sólida + Diamante Vacío) |
| **Asociación** | `>-` | `>asoc` | Asociación (Sólida + Flecha Abierta) |



[Image of UML relationship notation for class diagrams]


## 5. Ubicación de Relaciones
1. **En Cabecera**: `class A >> B { ... }`
2. **En Cuerpo (Atributo)**: `items: >* Clase`
3. **En Métodos (Parámetros)**: `+ set(p: >- Clase)`

## 6. Comentarios
* **Línea única (`//`)**: Puede ir al inicio o después de un comando (*Trailing Comment*).
* **Bloque (`/* ... */`)**: Comentarios multilínea.
* **Nota técnica**: El Lexer preserva los comentarios, pero el Parser los ignora para la construcción del AST.

## 7. Ejemplo de Referencia (Gold Standard)

## 8. Paquetes y Espacios de Nombres
El lenguaje permite organizar entidades mediante una estructura jerárquica de paquetes.

### 8.1. Declaración por Bloques
Se utiliza la palabra clave `package` para agrupar múltiples entidades. Los paquetes pueden anidarse de forma recursiva.
*   **Sintaxis**: `package Nombre { ... }`
*   **Ejemplo**:
    ```text
    package Core {
        package Domain {
            class Usuario
        }
    }
    ```

### 8.2. Declaración por Operador Punto (`.`)
Permite asignar una entidad a un paquete directamente sin necesidad de un bloque. El punto actúa como un operador de navegación recursivo.
*   **Sintaxis**: `class Paquete.SubPaquete.Clase`
*   **Ejemplo**: `class UI.Components.Button`

### 8.3. Reglas de Resolución
1.  Si una clase con nombre simple (`User`) está dentro de un bloque `package Core`, su nombre calificado absoluto es `Core.User`.
2.  Si una clase ya usa el operador punto dentro de un bloque, el nombre del bloque se antepone: `package A { class B.C }` resulta en `A.B.C`.
3.  El operador punto es válido también en relaciones: `class A >> B.C.D`.

## 9. Enumeraciones (Enums)
Los enums representan catálogos de opciones y se diseñan para minimizar la carga visual.

### 9.1. Definición Externa (Listas Largas)
Se utiliza para catálogos extensos o reutilizables. No utiliza llaves.
*   **Sintaxis**: `enum Nombre(VALOR1, VALOR2, ...)`
*   **Ejemplo**:
    ```text
    enum Estado(
        ACTIVO,
        INACTIVO,
        PENDIENTE
    )
    ```

### 9.2. Definición Inline (Listas Cortas)
Permite definir un enum en el momento de su primer uso dentro de un miembro.
*   **Sintaxis**: `nombre: > EnumName(OPCION1 | OPCION2)`
*   **Ejemplo**: `+ genero: > Sexo(M | F)`

### 9.3. Uso de Relación
Para referenciar un enum ya definido, se debe usar el iniciador de relación `>` para que el sistema genere el vínculo visual en el diagrama.
*   **Ejemplo**: `+ tipo: > TipoUsuario`
## 10. Multiplicidad (Cardinalidad)
Se utiliza para definir la cantidad de elementos en una relación o atributo (colecciones). Se define siempre entre corchetes `[]` después del tipo de dato.

### 10.1. Sintaxis Estándar
Soporta los patrones comunes de UML:
*   `[n]`: Valor fijo (ej. `[5]`).
*   `[n..m]`: Rango definido (ej. `[1..10]`).
*   `[n..*]`: Mínimo n, máximo muchos (ej. `[1..*]`).
*   `[*]`: Atajo para muchos.

### 10.2. Atajo de Practicidad (Normalización)
Para agilizar la escritura, el par de corchetes vacíos se normaliza automáticamente al valor de "muchos" de UML.
*   `[]` → Se interpreta internamente como `[0..*]`.

### 10.3. Ejemplo
```text
class Factura {
    - items: >* LineaFactura[1..*]
    - etiquetas: string[] // Se normaliza a [0..*]
}
```

```text
// Definición de un Guerrero
class Guerrero >> Personaje {
    - fuerza: int
    
    // Método con múltiples parámetros
    + atacar(enemigo: Monstruo, potencia: int): void

    /* Relación de composición 
       usando la nueva sintaxis */
    items: >* Espada[]
}
