# Definición de Tokens: UMLTS v0.8

Para el análisis léxico, el `ts-uml-engine` debe reconocer las siguientes categorías de tokens.

## 1. Palabras Clave (Keywords)

| Token | Texto | Significado |
| :--- | :--- | :--- |
| `KW_CLASS` | `class` | Definición de clase |
| `KW_INTERFACE` | `interface` | Definición de interfaz |
| `KW_ENUM` | `enum` | Definición de enumeración |
| `KW_PACKAGE` | `package` | Definición de paquete |
| `KW_PUBLIC` | `public` | Visibilidad pública |
| `KW_PRIVATE` | `private` | Visibilidad privada |
| `KW_PROTECTED` | `protected` | Visibilidad protegida |
| `KW_INTERNAL` | `internal` | Visibilidad de paquete |
| `KW_STATIC` | `static` | Miembro estático |
| `KW_ABSTRACT` | `abstract` | Clase o método abstracto |
| `KW_EXTENDS` | `>extends` | Alias de herencia |
| `KW_IMPLEMENTS` | `>implements` | Alias de implementación |
| `KW_COMP` | `>comp` | Alias de composición |
| `KW_AGREG` | `>agreg` | Alias de agregación |
| `KW_USE` | `>use` | Alias de dependencia |

## 2. Símbolos y Operadores

| Token | Texto | Significado |
| :--- | :--- | :--- |
| `OP_INHERIT` | `>>` | Relación de herencia |
| `OP_IMPLEMENT` | `>I` | Relación de implementación |
| `OP_COMP` | `>*` | Relación de composición |
| `OP_AGREG` | `>+` | Relación de agregación |
| `OP_USE` | `>-` | Relación de dependencia |
| `MOD_STATIC` | `$` | Modificador estático |
| `MOD_ABSTRACT` | `*` | Modificador abstracto |
| `OP_GENERIC_REL` | `>` | Iniciador genérico / mayor que |
| `LBRACE` | `{` | Inicio de bloque |
| `RBRACE` | `}` | Fin de bloque |
| `LPAREN` | `(` | Inicio de parámetros / enum |
| `RPAREN` | `)` | Fin de parámetros / enum |
| `LBRACKET` | `[` | Inicio de multiplicidad |
| `RBRACKET` | `]` | Fin de multiplicidad |
| `COLON` | `:` | Divisor de tipo |
| `COMMA` | `,` | Separador |
| `DOT` | `.` | Navegación de paquete |
| `RANGE` | `..` | Rango de multiplicidad |
| `PIPE` | `\|` | Divisor de enum inline |
| `STAR` | `*` | Multiplicidad "muchos" |
| `VIS_PUB` | `+` | Símbolo público |
| `VIS_PRIV` | `-` | Símbolo privado |
| `VIS_PROT` | `#` | Símbolo protegido |
| `VIS_PACK` | `~` | Símbolo de paquete |

## 3. Literales e Identificadores

| Token | Descripción |
| :--- | :--- |
| `IDENTIFIER` | Nombres de clases, métodos, atributos o paquetes. |
| `NUMBER` | Números enteros para la multiplicidad. |
| `STRING` | Texto entre comillas (para etiquetas de relaciones, si aplica). |

## 4. Otros

| Token | Descripción |
| :--- | :--- |
| `COMMENT` | Comentario de línea o bloque (el Lexer los identifica, el Parser los ignora). |
| `EOF` | Fin del archivo. |
| `UNKNOWN` | Carácter no reconocido por el lenguaje. |
