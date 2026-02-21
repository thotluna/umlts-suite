# Plan de Implementación: Sistema de Restricciones y Notas (Engine)

Este documento detalla la hoja de ruta técnica para implementar el soporte completo de Restricciones y Notas en el motor de UMLTS, siguiendo principios de código limpio y extensibilidad.

## Fase 1: Lexer y Vocabulario (Cimientos)

_No afecta la lógica actual, solo expande el diccionario del motor._

1. **Nuevos Tokens (`token.types.ts`)**:
   - `KW_NOTE`: Palabra clave `note`.
   - `OP_ANCHOR`: Renombrar o duplicar `RANGE` (..) para su uso semántico como anclaje.
   - `KW_DERIVED`: Palabra clave `derived`.
   - _Nota_: Las keywords de restricciones (readOnly, unique, etc.) se tratarán inicialmente como `IDENTIFIER` para mantener el Lexer ligero y delegar la validación al `ConstraintRegistry`.

2. **Actualización de Matchers (`lexer.ts`)**:
   - Registrar `note` y `derived` como palabras reservadas.
   - Asegurar que el anclaje `..` sea reconocido prioritariamente.

## Fase 2: Sintaxis y AST (Estructura)

_Define cómo se representan los nuevos elementos en el árbol sintáctico._

1. **Nodos del AST (`nodes.ts`)**:
   - `NoteNode`: Representación de una nota global o contextual.
   - `ConstraintNode`: Representación de una regla lógica `{ keyword: value }`.
   - `AnchorNode`: Representación del vínculo `..` entre elementos.
   - `XorTypeNode`: Para soportar `pago: xor { A, B }`.

2. **Reglas del Parser (`rules/`)**:
   - **`NoteRule`**: Parseo de `note "text" as ID`.
   - **`LinkRule`**: Parseo de `ID .. ID`.
   - **`ConstraintRule`**: Un sub-parseador especializado para el contenido dentro de `{ }`.
   - **Modificar `EntityRule`**: Permitir nodos de nota y restricción en el cuerpo.
   - **Modificar `MemberRule`**: Soportar notas contextuales (string al final de línea) y restricciones inline.

## Fase 3: Semántica y Memoria (Lógica)

_Donde el motor empieza a "entender" y validar las reglas._

1. **`ConstraintRegistry`**:
   - Nuevo componente para almacenar y validar todas las restricciones.
   - Catálogo de keywords estándar (UML 2.5.1).

2. **`DiscoveryPass` & `ResolutionPass`**:
   - Capturar notas y restricciones en el primer pase.
   - Resolver anclajes `..` en el pase de resolución (vincular IDs reales).
   - Implementar la heurística de **Atributos Derivados** (si tiene `{derived}`, marcar en la IR).

3. **Inferencia de `XOR Type`**:
   - El `MemberInference` debe transformar el tipo `xor {A, B}` en una estructura de unión discriminada válida para la IR.

## Fase 4: Intermediate Representation (IR)

_El contrato final que consume el Renderer._

1. **`IRNode` y `IRMember`**:
   - Añadir campos `notes: IRNote[]` y `constraints: IRConstraint[]`.
   - Asegurar que la meta-información viaje de forma limpia hacia el renderer sin ensuciar la lógica estructural.

2. **`IRRelationship`**:
   - Permitir que una relación sea origen o destino de un anclaje de nota.

---

## Verificación de Integridad (DOD)

- [ ] No hay regresiones en los tests de herencia y tipos.
- [ ] El parser acepta `"string"` dentro de clases como notas implícitas.
- [ ] El sistema de anclaje `..` resuelve correctamente FQNs.
- [ ] Los atributos marcados como `{derived}` se identifican correctamente en la IR.
