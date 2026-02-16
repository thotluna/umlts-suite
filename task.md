# Backlog

- [x] Unificar `>` y `<>` como asociaciones bidireccionales (línea simple).
- [x] Implementar `><` como asociación dirigida (punta de flecha abierta).
- [x] Corregir renderizado de etiquetas y multiplicidad en relaciones.
- [x] **Fix Urgente: Posicionamiento de errores semánticos** (ahora subrayan la línea correcta).
- [x] **Fix Urgente: Precisión de subrayado** (el subrayado ahora cubre la palabra completa).
- [x] **Fix Urgente: Higiene de IR** (bloquear creación de entidades/relaciones ilegales con paquetes).

## Backlog

- [x] Implementar clases de asociación (`class C <> (A, B)`)
  - [x] Definir nodo AST en `nodes.ts`
  - [x] Actualizar modelos de IR en `models.ts`
  - [x] Modificar `EntityRule` en el parser para soportar la sintaxis `<> (A[m], B[n])`
  - [x] Implementar lógica en `SemanticAnalyzer` para vincular la clase con la relación
  - [x] Añadir tests unitarios en `association-class.test.ts`
- [x] Mejorar Expresividad (Recursividad y Encadenamiento)
  - [x] Implementar encadenamiento de relaciones (`A >> B >> C`)
  - [x] Soportar participantes recursivos (`class C <> (A >> E, B)`)
  - [x] Validar restricción de binariedad (máximo 2 participantes principales)
- [x] Actualizar el Renderer para soportar clases de asociación
  - [x] Planificar la visualización (línea punteada hacia el centro de la clase)
  - [x] Implementar actualización de `UMLEdge` y `SVGRenderer`
- [ ] Documentar en `UML_SPEC.md` la nueva sintaxis y comportamiento.
- [ ] **Fase: Interoperabilidad Semántica (XMI/UMLDI)**
  - [ ] **Engine**: Implementar exportador de XMI (Metamodelo UML 2.5.1).
  - [ ] **Renderer**: Implementar exportador de UMLDI (Coordenadas y Geometría).
  - [ ] **VS Code**: Comando "Export to Standard UML" para consolidar ambos XML.
- [ ] **Advanced Autocomplete** (Sugerencias basadas en el SymbolTable).
- [ ] **Refactoring: Reverse Engineering** (Generación de diagramas desde código TS/Java).

## Bugs

- [x] Posicionamiento erróneo de diagnósticos semánticos (Hardcoded en línea 1).
- [x] Colisión de nombres entre Paquetes y Clases implícitas.
- [x] El ruteo de herencia a veces genera loops visuales en layouts complejos.
- [x] **FIX**: Doble corchete en multiplicidades de atributos (`[[1..*]]`).
- [x] **FIX**: Anclaje de línea de clase de asociación (la línea atravesaba la caja).
- [x] **FEAT**: Optimización de layout para clases de asociación (ahora se dibujan cerca de sus participantes).
- [x] **FIX**: Errores de tipos en tests de Inline Enums (posible acceso a undefined).

## Cumplimiento UML 2.5.1 (Roadmap)

- [x] **Acyclic Hierarchies** (No herencia circular).
- [x] **Multiplicity Consistency** (Composición <= 1).
- [x] **Namespace Uniqueness** (No duplicados en el mismo scope).
- [x] **Structural Integrity** (Enums e Interfaces no pueden ser "Whole" en composiciones).
- [x] **Classifier Validation** (Prohibir asociaciones/herencia con Paquetes).
- [x] **Modifiers: leaf, final, root** (Soportar y validar modificadores de herencia).
- [ ] **Redefinition & Subsets** (Poder decir que una propiedad redefine a otra).
- [ ] **Derived Properties** (Sintaxis `/propiedad` y validación).
- [ ] **Components & Ports** (Implementación de puertos físicos en límites de caja).
- [ ] **Generalization Sets** (Poder agrupar herencias con etiquetas como `{complete, disjoint}`).
- [ ] **FEAT**: Soporte para **Generalization Sets** (Disjoint/Complete) y Powertypes.

# Bugs

- [ ] **FIX**: Ruteo de aristas de herencia forzado a N->S provoca bucles innecesarios en algunos layouts complejos en proyectos grandes.
- [x] Refactorización: Análisis Arquitectónico y Refinamiento <!-- id: 5 -->
  - [x] Aplicar principios SOLID (OCP, DRY, KISS) en el Parser.
  - [x] Eliminar dependencias de TokenType en el orquestador Parser.ts.
  - [x] Implementar Representación Uniforme (StatementNode[]) en todas las reglas.
  - [x] Centralizar lógica de recuperación (synchronize) en ParserContext.
  - [x] Centralizar lógica de modificadores en `ParserContext.consumeModifiers()` (Cumplimiento DRY).
  - [x] **Refactorización Arquitectónica de ParserContext** (Grado Profesional):
    - [x] Extraer navegación a `TokenStream`.
    - [x] Extraer gestión de errores a `DiagnosticReporter`.
    - [x] Extraer gestión de documentación a `DocRegistry`.
    - [x] Convertir `ParserContext` en una Fachada (Facade) de coordinación (Sandbox).
    - [x] Elevar al `Parser` como protagonista.
    - [x] **Limpieza Arquitectónica** (Anti-Smell): Eliminar Feature Envy y centralizar sincronización en `ParserContext` mediante predicados.
  - [x] Validar principios SOLID (OCP, LSP, Alta Cohesión) en el pipeline del motor.
