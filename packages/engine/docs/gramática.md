# Gramática Formal: ts-uml-engine (UMLTS v0.8)

Esta gramática utiliza una notación similar a EBNF para definir la estructura sintáctica del lenguaje. Servirá como referencia absoluta para la implementación del **Recursive Descent Parser**.

## 1. Reglas Globales

```ebnf
program        ::= statement*

statement      ::= package_def
                 | entity_def
                 | relationship_def
                 | comment
```

## 2. Paquetes y Nombres

```ebnf
package_def    ::= "package" identifier "{" statement* "}"

identifier     ::= (alpha | "_") (alpha | digit | "_" | ".")*
/* Nota: El identificador permite puntos para la declaración directa de paquetes */
```

## 3. Entidades (Estructuras de Datos)

```ebnf
entity_def     ::= entity_type identifier [relationship_list] body_opt

relationship_list ::= relationship_item ("," relationship_item)*

relationship_item ::= relationship_type identifier

entity_type    ::= "class" | "interface" | "enum"

body_opt       ::= "{" member* "}"
                 | empty

member         ::= visibility_opt [static_opt] [abstract_opt] (method_def | attribute_def) [comment]

static_opt     ::= "static" | "$"
abstract_opt   ::= "abstract" | "*"

visibility_opt ::= "+" | "-" | "#" | "~" | "public" | "private" | "protected" | "internal" | empty
```

## 4. Atributos y Métodos

```ebnf
attribute_def  ::= identifier ":" [relationship_mark] type [multiplicity]

method_def     ::= identifier "(" [params] ")" [":" type]

params         ::= param ("," param)*
param          ::= identifier ":" type

type           ::= identifier | inline_enum

relationship_mark ::= ">*" | ">+" | ">-" | ">>" | ">I"
```

## 5. Relaciones

```ebnf
relationship_header ::= relationship_type identifier

relationship_def    ::= identifier multiplicity_opt relationship_type multiplicity_opt identifier

multiplicity_opt    ::= multiplicity | empty

relationship_type   ::= ">>" | ">extends"
                      | ">I" | ">implements"
                      | ">*" | ">comp"
                      | ">+" | ">agreg"
                      | ">-" | ">asoc"
```

## 6. Multiplicidad y Enums

```ebnf
multiplicity   ::= "[" (digit+ | "*" | digit+ ".." (digit+ | "*")) "]"
                 | "[]"  /* Atajo para [0..*] */

inline_enum    ::= identifier "(" identifier ("|" identifier)* ")"
```

## 7. Comentarios

```ebnf
comment        ::= "//" text_until_newline
                 | "/*" text_until_block_end "*/"
```

---

## Notas de Implementación (Recursive Descent)

1.  **Lookahead**: El parser necesitará un lookahead de 1 token para la mayoría de las decisiones.
2.  **Ambigüedad**: La declaración de relación en la cabecera vs. declaración suelta (`A >> B`) se resuelve verificando si después del identificador de la entidad sigue un símbolo `>`, o si estamos en el nivel raíz.
3.  **Recursividad**: Los paquetes son recursivos, lo que significa que el Parser llamará a `parseProgram()` dentro de `parsePackage()`.
