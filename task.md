# Backlog

- [x] Unificar `>` y `<>` como asociaciones bidireccionales (línea simple).
- [x] Implementar `><` como asociación dirigida (punta de flecha abierta).
- [x] Corregir renderizado de etiquetas y multiplicidad en relaciones.
- [x] **Fix Urgente: Posicionamiento de errores semánticos** (ahora subrayan la línea correcta).
- [x] **Fix Urgente: Precisión de subrayado** (el subrayado ahora cubre la palabra completa).
- [x] **Fix Urgente: Higiene de IR** (bloquear creación de entidades/relaciones ilegales con paquetes).

## Backlog

## Backlog

- [ ] **ALTA PRIORIDAD: Arquitectura Extensible de Lenguajes (Plugin System)**
  - [ ] **Core UML Purification**: Extraer tipos de TypeScript del motor core para dejarlo solo con los 5 `PrimitiveTypes` de UML 2.5.1.
  - [ ] **Plugin Infrastructure**: Implementar `LanguagePlugin` interface y `PluginManager` para cargar bibliotecas de modelos dinámicamente.
  - [ ] **Injection System**: Permitir que el `SymbolTable` se pre-pueble mediante plugins (`engine.load(TSPlugin)`).
  - [ ] **Language Mapping**: Sistema de reglas para que los plugins traduzcan sintaxis compacta (ej: `T[]` o `List<T>`) a semántica UML pura.
  - [ ] **First Plugin: TypeScript**: Migrar la lógica actual de TS a su propio módulo de plug-in.

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
- [x] Documentar en `UML_SPEC.md` la nueva sintaxis y comportamiento.
- [x] **FEAT: Soporte para Restricciones XOR**
  - [x] Implementar parsing de bloques `xor { ... }` y restricciones in-line.
  - [x] Análisis semántico y propagación al IR.
  - [x] Layout basado en atracción para grupos XOR.
  - [x] Renderizado de líneas punteadas y etiquetas `{xor}`.
- [x] **Renderer: Nueva Estrategia de Layout por Niveles**
  - [x] Implementar fase de pre-procesamiento para cálculo de Rango (Rank) basado en relaciones.
  - [x] Implementar inversión de flujo semántico para Herencia/Implementación.
  - [x] Configurar pesos de aristas en ELK según prioridad semántica.
- [x] **FEAT: Inline Members en Relaciones**
  - [x] Permitir bloques `{ ... }` en relaciones para definir miembros de la clase origen.
  - [x] Integrar con el Analizador Semántico para acumulación de miembros.
- [x] **FEAT: Control de Visibilidad de Dependencias**
  - [x] Implementar opción `showDependencies` en el bloque de configuración.
  - [x] Filtrado de aristas en el pipeline de renderizado.
- [ ] **Fase: Interoperabilidad Semántica (XMI/UMLDI)**
  - [ ] **Engine**: Implementar exportador de XMI (Metamodelo UML 2.5.1).
  - [ ] **Renderer**: Implementar exportador de UMLDI (Coordenadas y Geometría).
  - [ ] **VS Code**: Comando "Export to Standard UML" para consolidar ambos XML.

- [ ] **Advanced Autocomplete** (Sugerencias basadas en el SymbolTable).
- [x] **Refactoring: Reverse Engineering** (Generación de diagramas desde código TS).
  - [x] Implementar Lexer Atómico (Keywords, Identifiers, Symbols, Strings, Imports).
  - [x] Resolución de FQNs mediante mapa de imports relativos.
  - [x] Extracción de Anatomía de Clases (Atributos, Métodos, Modificadores y Tipos).
  - [x] Sistema de detección de dependencias cruzadas (Herencia, Implementación, Referencias).
  - [x] Refinamiento de grupos XOR en uniones complejas y nulabilidad.
  - [x] Soporte para FQNs en cabeceras de relación y multiplicidad en retornos del motor.
  - [x] Soporte para guiones en identificadores (kebab-case).
  - [x] Crear README con comandos de generación en `@umlts/blueprint`.

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
- [x] **FEAT**: Soporte para **Generales e Interfaces Genéricas** (UML Templates).
  - [x] Parsing de parámetros de tipo en entidades.
  - [x] Soporte en Mermaid Generator (sintaxis `~T~`).
  - [x] Renderizado de Template Box (recuadro punteado) en el SVG.
  - [x] Soporte para **Binding de Templates** (ej. `Repository<User>`).
    - [x] Detección automática de argumentos de tipo en relaciones.
    - [x] Mapeo de parámetros y generación de etiqueta `«bind»`.
    - [x] Renderizado multilínea en etiquetas de relación (Mermaid y SVG).
- [ ] **FEAT**: Soporte para **Generalization Sets** (Disjoint/Complete) y Powertypes.

# Bugs

- [ ] **FIX**: Ruteo de aristas de herencia forzado a N->S provoca bucles innecesarios en algunos layouts complejos en proyectos grandes.
- [ ] **BUG**: Asegurar que todas las relaciones de composición/agregación sean siempre navegables (flecha obligatoria).
- [ ] **BUG**: Corregir inconsistencias visuales y semánticas en la herencia doble/múltiple (ej. `A >> B >> C`).
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
  - [x] **Refinar Nodos de Sintaxis (AST Refactor)**:
    - [x] Unificar propiedades de modificadores en una interfaz reutilizable `Modifiers`.
    - [x] Actualizar `EntityNode`, `RelationshipHeaderNode`, `AttributeNode`, `MethodNode`, `ParameterNode` y `RelationshipNode` para usar `Modifiers`.
    - [x] Actualizar capa semántica (`EntityAnalyzer`, `RelationshipAnalyzer`, `SymbolTable`) para soportar la nueva estructura AST.
    - [x] Actualizar y validar diagramas de arquitectura (`parser.umlts`).

- [x] **Gestión proactiva de errores y robustez (Post-Rebase)**:
  - [x] Unificar `mapVisibility` para soportar palabras clave (public, private...) tras identificar fallos de mapeo.
  - [x] Refactorizar `MethodRule` y `ParameterRule` para usar `consumeModifiers()` centralizado.
  - [x] Asegurar integridad de tipos en `EntityAnalyzer` mediante narrowing explícito.
  - [x] Validar construcción total del monorepo (`pnpm -r build`) y tests unitarios.

# Notas de Implementación

- Se ha rebasado con éxito `feat/layout-xor-enhancements` sobre `origin/main` tras la refactorización SOLID.
- Todos los imports se han migrado de `parser/ast/nodes` a `syntax/nodes` para consolidar el lenguaje.
- Se ha corregido un bug en `EntityAnalyzer` donde visibilidades como `protected` no se mapeaban correctamente desde palabras clave.
- Los tests de navegabilidad y restricciones XOR han sido validados y pasan con éxito.
