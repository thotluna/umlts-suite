# Tareas de Inicialización de Git

- [x] Crear el plan de implementación
- [x] Configurar un `.gitignore` robusto
- [x] Inicializar el repositorio Git (`git init`)
- [x] Realizar el primer commit
- [x] Verificar el estado final

- [x] Corrección de Sintaxis de Relaciones
  - [x] Soporte de nombres cualificados (FQN) en Parser
  - [x] Soporte de genéricos en reglas de relación
  - [x] Reparación de lógica de namespaces para genéricos
  - [x] Verificación de renderizado inter-paquete
  - [x] Crear Specialist Class Diagrammer en `.agent/skills`

## Calibración Interactiva del DSL

- [x] Aprender patrones base (Vehiculo, Moto)
- [x] Aprender abstracción y agregación (Padre/Abuelo)
- [x] Patrones de Composición y FQN (Monitor)
- [x] Crear Cookbook de referencia
- [x] **BACKLOG**: Repasar casos de genéricos (errores de concepción y renderizado)

- [x] **BUG**: Corregir redundancia de atributos (no mostrar en cajetín si existe relación visual)
  - [x] Análisis arquitectónico (Opción A seleccionada)
  - [x] Extender `IRRelationship` con campo `visibility`
  - [x] **Semantic Analysis & Validation** <!-- id: 3 -->
    - [x] Implement semantic rules (Inheritance cycles, Type compatibility) <!-- id: 7 -->
    - [x] Implement member uniqueness validation <!-- id: 8 -->
  - [x] Adaptar renderer (si aplica) para mostrar visibilidad en roles
- [x] **BUG**: Etiquetas de roles se cortan en el renderizado (ej: `+ representación` -> `+ represent`)
- [x] **BUG**: Fallo al nombrar una clase abstracta en línea (reportado por usuario)
- [x] **FEAT**: Implementación completa de Clases Estáticas y Activas
- [x] **BUG**: El botón de exportar en la extensión (Preview) no funciona
- [x] Bug: Las relaciones se renderizan en (0,0) (como líneas huérfanas arriba a la izquierda).
  - Causa: ELK usa coordenadas relativas al contenedor, pero el renderizado SVG asume absolutas. Faltaba resolver los offsets jerárquicos de las aristas.
  - Solución: Implementada resolución recursiva de offsets de aristas y distribución por LCA.
- [x] **BUG**: Diagrama desconectado / Nodos fantasmas en arquitectura.
  - Causa: `SymbolTable` no resolvía nombres con puntos de forma relativa.
  - Solución: Corregida lógica de `resolveFQN` y actualizado script de arquitectura.
- [x] **BUG**: Interfaces en relaciones de atributos se renderizan como clases
  - Problema: En `arquitectuer no propaga el tipo de entidad (interface vs class) cuando crea relaciones implícitas desde atributos.
  - Solución propuesta: Extenra_motor.umlts`línea 135,`- relationships: >+ IRRelationship[]`muestra`IRRelationship` como clase en el diagrama, pero es una interfaz.
  - Causa: El SemanticAnalyzder la lógica de `resolveOrRegisterImplicit` para consultar el tipo real de la entidad referenciada y preservarlo en la entidad implícita.
- [x] **BUG**: Múltiples relaciones al mismo tipo con roles diferentes solo renderiza una
  - Problema: En `DiagramNode` hay dos atributos (`attributes: >* IRMember` y `methods: >* IRMember`) que apuntan al mismo tipo con roles differentes, pero el diagrama solo muestra la relación "attributes".
  - Causa: El motor de renderizado no maneja correctamente múltiples asociaciones desde la misma clase hacia el mismo tipo destino.
  - Impacto: Se pierde información semántica importante cuando una clase tiene múltiples relaciones con roles distintos hacia el mismo tipo.
  - Solución implementada: Modificado `shouldCreateInferredRel` para considerar el `label` al verificar duplicados, permitiendo múltiples relaciones hacia el mismo tipo cuando tienen roles diferentes.
- [x] **BUG**: Duplicidad visual de paquetes al usar FQN externos
  - Problema: Definir relaciones con FQN fuera de los bloques `package` provoca la creación de contenedores "fantasma" duplicados.
  - Causa: `SymbolTable.resolveFQN` no resolvía sufijos globales, creando entidades implícitas duplicadas.
  - Solución: Implementada resolución por sufijo global en `resolveFQN`.

## Optimización del Layout

- [x] Investigar parámetros de ELK para compactación
- [x] Crear plan de pruebas de parámetros
- [x] Aplicar mejoras y verificar resultados

## Ajuste Fino de Espaciado

- [x] Aumentar espaciado vertical entre capas
- [x] Duplicar espaciado vertical (Phase 2)
- [x] Triplicar espaciado vertical (Phase 3)
- [x] Ajuste Final de Parámetros (Phase 4)
- [x] Verificar balance entre horizontal y vertical

## Refinamiento Visual

- [x] Aumentar tamaño de flechas y rombos (Phase 5)
- [x] Ajustar MARKER_CLEARANCE para evitar solapamientos
- [x] Verificación final de estética con escenario complejo
- [x] Implementar dirección de layout (`config direction`)
- [x] Corregir bug de colisión 'constructor' en Lexer
- [x] Rediseño de Arquitectura (Motor)
  - [x] Componente Lexer (Revisión técnica)
  - [x] Corregir duplicidad de Matchers (Namespaces)
  - [x] Componente Parser
  - [x] Soporte de relaciones in-line en tipos de retorno de métodos
  - [x] Componente Semantics
  - [x] Componente Generator e IR
  - [x] Reparación de errores del diagrama (skill UML Diagram Generation)
    - [x] Corregir 5 referencias FQN incorrectas
    - [x] Corregir declaración de enums (interface → enum)
  - [x] Agregar paquete Engine (UMLEngine facade)
  - [x] **FIX**: Soporte FQN en Parser y Analyzer (core.DiagramNode)
  - [x] **IMPROVEMENT**: Mejor manejo de errores en VS Code Preview
  - [x] **FIX**: ELK falla con edges cross-package → Simplificadas opciones de layout

## Arquitectura y Estructura (Renderer)

- [x] Análisis arquitectónico del pipeline (Aprobado)
- [x] Refactorización estructural por etapas del Pipeline:
  - [x] Crear estructura de Vertical Slices (`adaptation/`, `layout/`, `drawing/`)
  - [x] Mover componentes del Core a sus respectivas etapas
  - [x] Reubicar Helpers (`utils/`) y Elementos (`elements/`) junto a sus consumidores
  - [x] Actualizar imports
  - [x] Verificar integridad del bundle
- [x] **FEAT**: Evolución Arquitectónica (Renderer V2)
- [x] Segregación del Core (`contract/` vs `model/`)
- [x] Transformación a Modelo de Dominio Rico (Clases `UMLNode`, `UMLEdge`)
- [x] Implementación de `SVGBuilder` y Patrón de Dibujo Desacoplado
- [x] Formalización del Orquestador de Pipeline (`UMLRenderer`)
- [x] Abstracción de Jerarquía (`UMLHierarchyItem`) para soporte agnóstico de contenedores
- [x] Corrección de Bug de Layout Hierárquico (Offsets de aristas y proporciones)
- [ ] **TASK**: Unificar y normalizar términos de relaciones (Inheritance vs Generalization, Case-sensitivity) y eliminar redundancia en diccionarios de `edges.ts`.

## Publicación y Despliegue

- [x] **TASK**: Login en NPM
- [x] **TASK**: Configurar tokens de acceso (si es necesario)
- [x] **TASK**: Verificar permisos de publicación

## Refactorización del Motor (Parser V2)

- [x] **TASK**: Descomposición de la "God Rule" `EntityRule`
  - [x] Extraer `MemberRule` (Atributos y Métodos)
  - [x] Extraer `ParameterRule`
  - [x] Extraer `RelationshipHeaderRule` (Lógica de herencia/relaciones en cabeceras)
  - [x] Implementar soporte para `EnumRule` especializada
  - [x] Extraer `ModifierRule` de `ParserContext` (Refactor de extensibleibilidad)
  - [x] Convertir `ParserContext` en Fachada pura (desacoplamiento de plugins)
  - [x] Implementar arquitectura de Plugins como Reglas/Proveedores proactivos
  - [x] Verificar integridad del AST y build

## Soporte para Configuración de Diagrama (DSL)

- [x] **TASK**: Definir sintaxis del bloque de configuración (ej: `config { ... }`)
- [x] **TASK**: Actualizar Lexer con nuevos tokens (`config`, llaves, etc.)
- [x] **TASK**: Implementar `ConfigRule` en el Parser
- [x] **TASK**: Extender AST para incluir el nodo de configuración
- [x] **TASK**: Propagar configuración a través de la IR
- [x] **TASK**: Adaptar Renderer para consumir opciones dinámicas

### Herramientas de Desarrollo (LSP)

- [x] **TASK**: Añadir autocompletado para el bloque `config` y sus propiedades
- [x] **TASK**: Incluir ayuda contextual (tooltips) para opciones de configuración

## Optimizaciones Avanzadas (ELK Expert Level)

- [x] **TASK**: Implementar Puertos (Ports) en nodos de Clase
  - [x] Definir interfaz de Ports en el modelo interno del Renderer
  - [x] Añadir puertos cardinales (N, S, E, W) a cada nodo en la fase de Adaptación
  - [x] Actualizar el generador de JSON para ELK con la estructura de `ports`
- [x] **TASK**: Enrutamiento Ortogonal (Ángulos Rectos)
  - [x] Investigar y aplicar `elk.edgeRouting: ORTHOGONAL`
  - [x] Ajustar puntos de control para que el SVG dibuje líneas quebradas en lugar de rectas/curvas
- [x] **TASK**: Refinar Jerarquía Completa
  - [x] Asegurar que las aristas conecten puertos finales (`ClaseA.out` -> `ClaseB.in`)
  - [x] Optimizar `layoutOptions` para minimizar cruces de líneas
- [x] **FEAT**: Optimización de Layout (Long Hierarchical Edges)
  - [x] Implementar espaciado dinámico basado en `config` (Horizontal y Vertical)
  - [x] Migrar de puertos fijos a `portConstraints: FREE` para evitar embudos
  - [x] Desactivar `mergeEdges` para trayectorias de aristas independientes
  - [x] Optimizar cruce de paquetes mediante enrutamiento jerárquico nativo

## Depuración y Calidad (VS Code Extension)

- [x] **BUG**: Corregir errores de resolución de módulos (`ts-uml-engine` -> `@umlts/engine`)
- [x] **FEAT**: Sincronizar autocompletado y ayuda contextual en `extension.ts`
- [x] **IMPROVEMENT**: Soporte para propiedades de `config` contextuales
- [x] **FIX**: Mapeo correcto de severidad de diagnósticos (Warnings vs Errors)
- [x] **FEAT**: Añadir botones para visualizar AST nativo completo e IR (Intermediate Representation) en formato JSON
- [x] **VERIFY**: Verificación de compilación exitosa de la extensión

## Mantenimiento y Rendimiento (Pnpm & Workspace)

- [x] **TASK**: Migrar la gestión de paquetes de `npm` a `pnpm`.
- [x] **FIX**: Resolver dependencias faltantes de `vscode-languageserver` en `apps/vscode`.
- [x] **IMPROVEMENT**: Configurar `NodeNext` en `server/tsconfig.json` para soporte nativo de `exports` de espacio de trabajo.
- [x] **FIX**: Tipado fuerte en `server.ts` (eliminación de `any` y uso de interfaces de IR).
- [x] **OPTIMIZATION**: Corregir bucle de construcción recursivo y habilitar `pnpm -r build` para paralelismo seguro.
- [x] **IMPROVEMENT**: Optimizar el layout de ELK para reducir desorden, mejorar compacidad y minimizar cruces.
- [x] **FEATURE**: Implementar sistema de auto-escalado (responsive) y zoom manual
- [x] **IMPROVEMENT**: Mejorar legibilidad and encuadre dinámico (Auto-Fit corregido)
- [x] **FIX**: Viewport del SVG ignora los límites de los paquetes (Clipping)
- [/] **FIX**: Ruteo de aristas de herencia forzado a N->S provoca bucles innecesarios
- [x] **FIX**: Robustecer autocompletado de `config` en LSP (Heurística de detección de contexto)

### Motor (@umlts/engine) - Preparación Alpha

- [x] **FIX**: Corregir tests de Lexer (`TokenType.GT` mismatch)
- [x] **FIX**: Corregir tests de Parser (Ajustar a `TypeNode` en lugar de strings)
- [x] **CHORE**: Evaluar y mejorar cobertura de tests del motor
- [x] **CHORE**: Actualizar versión a `0.8.0-alpha.1` e incluir `README` básico

### Infraestructura de Calidad y CI

- [x] **CHORE**: Configurar ESLint y Prettier (Base monorepo - "TS Standard")
- [x] **CHORE**: Configurar Husky y lint-staged (Pre-commits)
- [x] **CHORE**: Configurar GitHub Actions (CI para PRs: Lint + Test + Build)
- [x] **CHORE**: Eliminar `any` y estandarizar tipos en `@umlts/engine` y `@umlts/renderer`
- [x] **FIX**: Corregir uso de `any` en `packages/engine/src/semantics/__test__/semantic-rules.test.ts`
- [x] **FIX**: Error de compilación en `index.ts` (faltaba instanciar `ParserContext` para `SemanticAnalyzer`)
- [x] **FIX**: Validar relaciones de nivel superior y mejorar reporte de errores semánticos <!-- id: 189 -->
- [x] **CHORE**: Corregir errores de formato Prettier y ESLint auto-fix <!-- id: 190 -->
- [x] **FIX**: Resolver conflictos entre Prettier y el formateador interno de VS Code
- [x] **CHORE**: Configurar ESLint y Prettier con `standard-with-typescript` y resolver conflictos de versión <!-- id: 196 -->
- [x] **FIX**: Resolver errores de linter por reglas incompatibles de Standard v8 e ignorar archivos de configuración <!-- id: 197 -->
- [x] **FIX**: Limpiar los 21 warnings restantes del linter (variables no usadas y console statements en herramientas) <!-- id: 198 -->

## Refactorización del Análisis Semántico (V2)

- [x] **ARCH**: Dividir `SemanticAnalyzer` en sub-componentes especializados <!-- id: 191 -->
  - [x] Crear `EntityAnalyzer`, `RelationshipAnalyzer` y `ContextAnalyzer`
  - [x] Implementar `TypeValidator`, `HierarchyValidator` y `FQNBuilder`
- [x] **FEAT**: Implementar validación de tipos en miembros (atributos/parámetros) <!-- id: 192 -->
- [x] **FEAT**: Añadir advertencias (Warnings) para entidades implícitas <!-- id: 193 -->
- [x] **FIX**: Mejorar construcción de FQNs para soportar rutas absolutas <!-- id: 194 -->
- [x] **TEST**: Verificar refactorización con batería de tests extendida <!-- id: 195 -->
- [x] **FIX**: Depuración y resolución de fallos en CI (Build @umlts/renderer)
  - [x] Corregir lógica de nulos en `LayoutEngine` (`elkNode.children ?? []`)
  - [x] Estandarizar IR entre motor y renderer para evitar conflictos de tipos
  - [x] Resolver advertencias de `any` implícito en el renderer
  - [x] Verificar build y tests locales en todo el workspace
  - [x] Purgar y verificar CI en GitHub
- [x] **FEAT**: Implementar reglas de UML 2.5.1 sobre Propiedades/Atributos
  - [x] Validación de consistencia de multiplicidad (`upper >= lower`)
  - [x] Validación de agregación compuesta (multiplicidad del contenedor <= 1)
- [x] **REFAC**: Implementar estrategia de análisis de 3 pases (Discovery, Definition, Resolution)
- [x] **FIX**: Mejora de resolución FQN con mechanism "Global Scout"
- [x] **FEAT**: Registro automático de entidades implícitas en tipos de miembros (Sencillez UMLTS)
- [x] **FIX**: Soporte de multiplicidad en parámetros de métodos (ej: `name: type[1..*]`)
- [x] **FIX**: Resolución de FQN en relaciones externas y paquetes anidados
- [x] **FIX**: Ubicación precisa (Line/Col) en diagnósticos de entidades implícitas
- [x] **FIX**: Soporte de relaciones por defecto (Asociación) para miembros sin operador
- [x] **FIX**: Corregir arquitectura de `semantics.umlts` para reflejar la estructura real de paquetes (`parser`, `generator.ir`)
- [x] **CHORE**: Traducir todos los mensajes de error y comentarios internos al inglés (Regla Global #2)
- [x] **FEAT**: Implementar sistema de inferencia de tipos por contexto de relación (`TypeInferrer`)
- [x] **FIX**: Resolver ambigüedades en entidades implícitas (`class >I B` ahora registra `B` como Interfaz)
- [x] **TEST**: Alcanzar cobertura del 96% en el paquete `semantics`
- [x] **DOC**: Actualizar `semantics.umlts` con la nueva arquitectura (TypeInferrer, rules)
- [x] **PR**: Crear Pull Request "Refactor Semántico V2: Declaraciones Flexible y Resolución FQN Robusta"

## Próximos Pasos (V3)

- [x] Implementar documentación técnica avanzada con Astro + Starlight
- [x] Reorganizar contenido por pilares de desarrollador y añadir renderizado dinámico de UMLTS
- [x] Implementar autocompletado avanzado basado en la nueva resolución FQN

## Ingeniería Inversa Blueprint (Extractor v1.0)

- [x] **FEAT**: Create `@umlts/blueprint` package structure
- [x] **FEAT**: Implement `BlueprintExtractor` based on `ts-morph`
- [x] **FEAT**: Support for Inheritance, Realization, Association, Aggregation, and Composition
- [x] **FEAT**: Implement Dependency detection (`>-`) via AST analysis of method bodies
- [x] **DOC**: Document relationship heuristics (Visibility, Versatility, Momentarity)
- [x] **IMPROVEMENT**: "Surgeon Effect" (Public Getters) and Global Versatility Map
- [x] **IMPROVEMENT**: "Surgeon Effect" (Public Getters) and Global Versatility Map

## Ingeniería Inversa Quirúrgica (Surgeon Extractor)

- [x] **TASK**: Definir workflow de extracción manual en .agent/workflows/surgeon-extractor.md
- [x] **FEAT**: Implementar Pasada -1 (Configuración)
  - [x] Lectura de tsconfig.json para resolución de Aliases (Heurística inicial implementada)
  - [x] Mapeo de paquetes basado en estructura de carpetas de monorepo
- [x] **FEAT**: Implementar Pasada 0 (Imports & Scope)
  - [x] Escaneo de cabeceras para mapeo de FQNs vía imports
  - [x] Identificación de dependencias externas (Shadowing)
- [x] **FEAT**: Implementar Pasada 1 (Órganos)
  - [x] Extracción de entidades (class/interface)
  - [x] Mapeo de atributos estructurales para composición/agregación
- [x] **FEAT**: Implementar Pasada 2 (Síntesis & Cirujano)
  - [x] Escaneo de firmas de métodos para dependencias de uso
  - [x] Aplicación del Surgeon Effect (No duplicar líneas si hay relación estructural)
- [x] **TEST**: Validar extracción del paquete engine/semantics sin ruido visual y compilación Exitosa (Verificado con CLI)
- [x] **FIX**: Corregir "ruido" en extracción de miembros (evitar capturar parámetros de métodos como propiedades)
- [x] **IMPROVEMENT**: Implementar resolución FQN basada en imports para evitar duplicidad de clases en el diagrama
- [x] **IMPROVEMENT**: Sanitización de identificadores (keywords) y limpieza de tipos complejos (generics, Object, Function)
- [x] **IMPROVEMENT**: Add CLI support for blueprint to generate .umlts files from terminal

## Refactorización de Semántica para Soporte de Plugins (V3)

- [x] Diseñar arquitectura de Análisis Semántico modular (Session, Passes, Inference)
- [x] Implementar Refactorización de Semantic Analyzer
  - [x] Crear `ConstraintRegistry` y `ConfigStore`
  - [x] Implementar `AnalysisSession`
  - [x] Implementar `TypeResolutionPipeline` y `PluginAdapters`
  - [x] Extraer lógica de inferencia a `MemberInference`
  - [x] Migrar visitors a Passes (`Discovery`, `Definition`, `Resolution`)
  - [x] Orquestar todo en `SemanticAnalyzer` slim
- [x] Implementar soporte para Plugins de Lenguaje
  - [x] Definir interfaz `LanguagePlugin`
  - [x] Crear adaptador para integración en pipeline
- [x] Crear tests unitarios para nuevos componentes
  - [x] `ConstraintRegistry`, `ConfigStore`, `AnalysisSession`
  - [x] `TypeResolutionPipeline`, `PluginAdapter`
  - [x] `MemberInference`, `AssociationClassResolver` (Tests completos y sin errores)
- [x] **FIX**: Corregir bug de "Unrecognized statement" con comentarios en el Parser
- [x] **FIX**: Activar plugins de forma condicional basada en `config { language: ... }`
- [x] **FEAT**: Crear ejemplo exhaustivo del DSL en `docs/tests-dsl.umlts`
- [x] **COMMIT**: Realizar commit final de la refactorización V3 y DSL refinado
- [x] Optimizar el registro de plugins en la fachada `UMLEngine` para escalabilidad (uso de `BUILTIN_PLUGINS`)
- [x] Desacoplar `ParseResult` de `index.ts` a `generator/types.ts`
- [x] **LEXER**: Refactorizar Lexer a patrón Composite completo (unificación de matchers)
  - [x] Implementar `AbstractCompositeMatcher` y `MasterMatcher`
  - [x] Descomponer `CommentMatcher`, `SymbolMatcher`, `IdentifierMatcher`, `NumberMatcher`, `StringMatcher` y `WhitespaceMatcher` en matchers atómicos.
  - [x] Unificar la entrada del Lexer a un único `rootMatcher`.
  - [x] Fortalecer suite de pruebas del Lexer (Ambiguity, Greedy matching, Error recovery)
- [x] **DOC**: Consolidar guía oficial del DSL (`dsl-guide.md`) y purgar documentación obsoleta

## Refinamiento de Semántica DataType (UML 2.5.1)

- [x] **FEAT**: Implementar tipos estándar de TypeScript como DataType (`Date`, `URL`, `RegExp`, `Error`)
- [x] **FEAT**: Implementar heurística de promoción a `DataType` (Value Object) para clases e interfaces sin métodos (solo en TS).
- [x] **FIX**: Ley de Identidad: Revertir a `Interface` o `Class` si la entidad es implementada o extendida por otros (Jerarquía externa).
- [x] **FIX**: Evitar promoción automática en modo "boceto" (sin lenguaje TS) para respetar la declaración explícita.
- [x] **FIX**: Evitar promoción de clases con herencia (>>) o realizaciones (>i) en el encabezado.
- [x] **IMPROVEMENT**: Actualizar reglas de inferencia para soportar `DataType` como origen de relaciones.
- [x] **FIX**: Asegurar que `DefinitionPass` captura las relaciones de cabecera para la heurística.
- [x] **TEST**: Validar leyes de jerarquía externa (implementación/herencia) en `test-datatype-hierarchy.umlts`.
- [x] **FIX**: Ley de Identidad Estricta: Cualquier modificador (abstract, final, static, etc.) bloquea la promoción a `DataType`.
- [x] **COMMIT**: Consolidar cambios de semántica DataType y leyes de jerarquía.

## Sistema de Restricciones y Notas (UML 2.5.1)

- [x] **DOC**: Definir catálogo de restricciones estándar y sintaxis unificada (`docs/REQUERIMIENTOS_CONSTRAINTS.md`)
- [x] **FEAT**: Actualizar Lexer with tokens for `note`, `..`, `derived` and nuevas keywords
- [x] **FEAT**: Implementar `NoteRule` y `LinkRule` en el Parser
- [x] **FEAT**: Implementar soporte para restricciones in-line y de bloque en miembros
- [x] **FEAT**: Implementar `XOR Type` (Unión Discriminada) en la IR and Semántica (Mapping a xor_member)
- [x] **FEAT**: Soporte de propiedades derivadas (`/` via `{derived}`) y notas de miembros help
- [x] **FEAT**: Reparación de SemanticAnalyzer (Pases 1-3, Bloques XOR, Modificadores de métodos)
- [x] **FEAT**: Actualizar Renderer para dibujar Notas y líneas de anclaje (dashed)
  - [x] Extender IR en el motor para capturar `IRNote` e `IRAnchor`
  - [x] Actualizar pases semánticos para recolectar notas y anclajes
  - [x] Implementar `UMLNote` y `UMLAnchor` en el modelo del renderer
  - [x] Integrar notas en la estrategia de layout (ELK) y cálculo de dimensiones
  - [x] Implementar renderizado SVG para notas (efecto dog-ear) y anclajes (líneas punteadas)
  - [x] Visualizar restricciones in-line en miembros de entidades

## Refactorización de Estado y Pipeline (Sync)

- [x] Desacoplar resultados de fase del `CompilerContext` hacia `PipelineArtifacts`
- [x] Reducir `CompilerContext` a entorno puro (diagnósticos, plugin, source)
- [x] Hacer síncrono el pipeline de análisis semántico y la fachada `UMLEngine`
- [x] Desacoplar `SemanticAnalyzer` del contexto y moverlo a `SemanticPhase`
- [x] Refactorizar `PhasesFactory` para ser instanciable y poseer el `PluginManager`
- [x] Limpiar `index.ts` eliminando exportaciones redundantes y métodos de debug (`getTokens`)

## Correcciones de Estado y Tipos (Post-Refactor)

- [x] Corregir tipo `MemberNode` para incluir `ConstraintNode` y `NoteNode`
- [x] Corregir acceso a propiedad `name` en `EntityAnalyzer` para miembros anónimos (constraints/notes)
- [x] Corregir tipo de nodo para proveedores de elección (`xor`) en `TypeNode.kind`

## Refactorización de Infraestructura y Tipos (Correctitud Arquitectónica)

- [x] **TASK**: Refactorizar importaciones del Renderer para integridad del contrato IR
  - [x] Establecer `@umlts/engine` como única fuente de verdad para el contrato IR
  - [x] Purgar barrel exports de `core/types.ts` y separar modelos visuales
  - [x] Eliminar todos los usos de `any` en la lógica de transformación y dibujo (Renderer)
  - [x] Corregir dependencias circulares y asegurar build limpio en todo el monorepo

## Correcciones de Renderizado y Calidad (VS Code Preview)

- [x] **FIX**: Diagramas no renderizan en VS Code por fallos en importación dinámica de temas
  - [x] Sustituir `import()` dinámico por importaciones estáticas de `lightTheme` y `darkTheme` en `preview.ts`.
- [x] **FIX**: Nodos dentro de paquetes (namespaces) invisibles o sin dimensiones (0x0)
  - [x] Modificar `IRAdapter` para incluir todos los nodos en `model.nodes` independientemente de su profundidad. Esto permite al motor ELK calcular dimensiones correctas para elementos anidados.
- [x] **FIX**: "Ruido" visual de la librería estándar de TypeScript en diagramas
  - [x] Implementar filtrado de `hiddenEntities` en `IRAdapter` para no renderizar primitivos y utilidades de TS inyectadas por el plugin.
  - [x] Filtrar relaciones (edges) que apuntan a primitivos/entidades ocultas en `IRAdapter` para evitar `JsonImportException` en ELK ("Referenced shape does not exist").
  - [x] **FIX**: Palabras reservadas (enum, xor) invisibles en literales de enum
  - [x] Modificar `EntityRule.ts` para permitir palabras clave como literales de enum en bloques y en línea.
  - [x] Modificar `EnumTypeModifier.ts` para permitir palabras clave como valores en tipos de enum en línea.
- [x] **FIX**: Multiplicidad duplicada en el renderizado de atributos (ej: `code: Type[0..1] [0..1]`)
  - [x] Eliminar la concatenación redundante de la multiplicidad en la propiedad `raw` del `TypeNode` dentro de `MemberSuffixRule.ts`.

## Refactorización de Arquitectura Parser (V3)

- [x] **DESIGN**: Crear documento de arquitectura V3 (`docs/PARSER_V3_ARCHITECTURE.md`)
- [x] **PLAN**: Crear plan de implementación paso a paso (`docs/PARSER_V3_IMPLEMENTATION_PLAN.md`)
- [x] **TASK**: Implementar `ASTFactory` para centralizar creación de nodos
- [x] **TASK**: Migrar todas las reglas del parser para utilizar `ASTFactory` de forma consistente
- [x] **CONTRACT**: Crear interfaz `IParserHub` y hacer que `ParserContext` la implemente
- [x] **TASK**: Refactorizar reglas para usar `IParserHub` en lugar de `ParserContext` (Eliminar dependencia circular)
- [x] **TASK**: Refactorizar `ParserContext` para eliminar dependencias estáticas y separar el `StateStore` (ParserSession)
- [x] **TASK**: Desacoplar `MemberRegistry` (instancia vs static) y mover a inyección de dependencias
- [x] **ARCH**: Separar `EnumRule` y `AssociationClassRule` de `EntityRule`
- [x] **TASK**: Implementar sistema de sincronización basado en heurísticas `canHandle` de reglas registradas
- [x] **TASK**: Migrar reglas existentes al nuevo sistema de base (`StatementRule` / `MemberProvider`)
- [x] **VERIFY**: Asegurar paridad de funcionalidades y 100% de éxito en tests de integración
- [x] **REFACTOR**: Mejorar `ModifierRule` para que gestione automáticamente modificadores Pre y Post palabra clave, centralizando la lógica que actualmente está duplicada en `EntityRule` y `EnumRule`.
- [x] **ARCH**: Dividir `EntityRule` en `ClassRule` e `InterfaceRule` utilizando una clase base abstracta `BaseEntityRule` para mejorar la atomicidad y mantenibilidad.
- [x] **DX**: Configurar Aliased Imports (`@engine/*`) en `tsconfig.json` y `vitest.config.ts`.
- [x] **DX**: Refactorización masiva de todos los imports en el paquete `engine` para utilizar el nuevo alias `@engine`, eliminando rutas relativas complejas.

## Refactorización de Semántica (V3 - SaaS Ready)

- [x] **Phase 0**: Migrar infraestructura compartida (`DiagnosticReporter`) a `src/core` <!-- id: 400 -->
- [x] **Phase 0.5**: Cimentación de Infraestructura Semántica <!-- id: 401 -->
  - [x] Implementar `ISemanticContext` e `IRFactory`
  - [x] Implementar `ValidationEngine` base y Registro de Reglas
- [x] **Phase 1**: Desacoplamiento Total del Parser <!-- id: 402 -->
  - [x] Migrar `SemanticAnalyzer` para usar `ISemanticContext`
  - [x] Eliminar toda dependencia de `@engine/parser` en el paquete de semántica
- [x] **Phase 2**: Reglas Atómicas y Concurrencia <!-- id: 403 -->
  - [x] Refactorizar validaciones existentes a `ISemanticRule` (Stateless)
  - [x] Implementar motor de ejecución de reglas (con soporte futuro para paralelismo)
- [x] **Phase 3**: Migración de Componentes Especializados <!-- id: 404 -->
  - [x] Actualizar Analizadores (`Entity`, `Relationship`, `Constraint`) (Completado implícitamente en Fases 1-2)
  - [x] Actualizar Validadores (`Hierarchy`, `Association`, `Multiplicity`) (Completado implícitamente en Fases 1-2)
- [x] **Phase 4**: Integración en el Pipeline (Compiler Phase) <!-- id: 405 -->
  - [x] Refactorizar `SemanticPhase` (`compiler/phases/semantic.phases.ts`)
  - [x] Instanciar `ISemanticContext` directamente sin `ParserContext`
- [x] **Phase 5**: Limpieza Estricta y Verificación <!-- id: 406 -->
  - [x] Purgar importaciones de Parser remanentes (si las hubiera)
  - [x] Verificación final tests/build

## Refactorización de Arquitectura Semántica (V3.5 - Clean Architecture)

- [x] **TASK**: Rediseño de `SemanticAnalyzer` para desacoplamiento total
  - [x] Implementar `SemanticServicesFactory` para centralizar la instanciación de dependencias.
  - [x] Externalizar la configuración del `ValidationEngine` mediante un proveedor de reglas.
  - [x] Mover heurísticas de TypeScript (`DataType` promotion) al plugin de lenguaje.
  - [x] Simplificar `analyze` para que sea una orquestación pura de servicios.
  - [x] Habilitar Inyección de Dependencias en el constructor para facilitar el testing.
- [x] **REFACTOR**: Pre-escaneo de configuración y motor UML "bruto"
  - [x] Crear `ConfigPreScanner` para detectar el lenguaje antes del proceso de compilación principal.
  - [x] Integrar el pre-escaneo en la primera línea de `UMLEngine.parse` para asegurar la activación temprana de plugins.
  - [x] Limpiar `TypeValidator` y `UMLTypeResolver` para que sean estrictamente conformes a UML (case-sensitive, solo 5 primitivas).
  - [x] Delegar la validación de tipos específicos de lenguaje a la interfaz `LanguagePlugin`.

## Purificación de la Arquitectura del Motor (Pure UML)

- [x] **ARCH**: Eliminar toda lógica y dependencia de plugins del núcleo del motor <!-- id: 500 -->
  - [x] Purgar `PluginManager` de `UMLEngine`, `PhasesFactory` and `SemanticAnalyzer`
  - [x] Eliminar `TypeResolutionPipeline` y adaptadores de plugins de los analizadores semánticos
  - [x] Refactorizar `EntityAnalyzer` y `RelationshipAnalyzer` para cumplimiento estricto de UML 2.5.1
  - [x] Purificar `ConfigStore` y `AnalysisSession` (eliminación de activación de lenguajes)
  - [x] Actualizar diagramas de arquitectura (`engine-architecture.umlts`) para reflejar un motor UML puro
  - [x] Eliminar archivos y tests obsoletos relacionados con la infraestructura de plugins

## Arquitectura de Plugins Descentralizada (IoC)

- [x] Diseñar arquitectura de plugins basada en `getCapability` (docs/plugin-architecture.md)
- [x] Crear plan de implementación detallado (docs/plugin-implementation-plan.md)
- [x] Definir interfaces base `IUMLPlugin` y `ILanguageAPI` (Fase 1 - Diseño)
- [x] Establecer estrategia de carga perezosa y restricción de instancia única
- [x] Implementar `PluginRegistry` y `LanguageExtension` (Fase 2)
- [x] Integrar `PluginRegistry` en `UMLEngine` y `CompilerContext` (Fase 3)
- [x] Implementar punto de extensión léxica y priorizar matchers de UML (Fase 4)
- [x] Implementar puntos de extensión sintáctica y actualizar ParserHub (Fase 5)
- [x] Cierre Semántico y Validación Inicial: registro de tipos primitivos (Fase 6)
- [x] Verificar integración completa con tests de extremo a extremo
- [x] **REFAC**: Refinamiento de Análisis Semántico y Type Resolution
  - [x] Implementar `TypeResolutionPipeline` para gestionar múltiples estrategias de resolución
  - [x] Integrar `ITypeResolutionStrategy` en la arquitectura de plugins (`ILanguageAPI`)
  - [x] Actualizar `AnalysisSession` y `SessionFactory` para inyectar el pipeline de resolución
  - [x] Refactorizar `MemberInference`, `EntityAnalyzer` y `RelationshipAnalyzer` para usar el pipeline
  - [x] Corregir errores de importación y asegurar robustez en `UMLTypeResolver`
  - [x] Purificar `SymbolTable` eliminando primitivas hardcodeadas y usando registro dinámico
- [x] **DOC**: Profundizar y ampliar el Plan de Implementación de Plugins (Fase 7)
- [x] **SYNTAX**: Extensión de la Gramática TS (Fase 7.3)
  - [x] Implementar `TSNamespaceRule` y `TSTypeAliasRule`
  - [x] Implementar `TSUnionTypeModifier` para soporte de `|` (Unions)
- [x] **SEMANTICS**: Dominio Semántico TS (Fase 7.4)
  - [x] Implementar `TSGenericResolutionStrategy` y `TSMappedTypeStrategy`
  - [x] Implementar `RegisteredPrimitiveStrategy` en el motor para reconocer primitivos de plugins
- [x] **FIX**: Refinamiento de Inferencia de Miembros y Primitivos
  - [x] Soporte recursivo para tipos genéricos (ej: `Array<User>`) en `MemberInference`
  - [x] Mapeo automático de multiplicidad TS (`Array` -> `*`, `| null/undefined` -> `0..1`)
  - [x] Corrección de `RegisteredPrimitiveStrategy` para no registrar primitivos como entidades implícitas
  - [x] Creación del paquete `@umlts/cli` para desacoplar las herramientas de depuración del motor core
  - [x] Soporte para tipos unión (`|`) en el `TypeValidator` del motor

## Refactorización de Arquitectura Renderer (V3)

- [x] **ANÁLISIS**: Descomposición en bloque de legos y análisis de violaciones SRP/DIP (`docs/RENDERER_V3_ANALYSIS.md`)
- [x] **DISEÑO**: Plan de arquitectura de Puertos y Adaptadores para extensibilidad e interactividad (`docs/RENDERER_V3_DESIGN.md`)
- [x] **PLAN**: Estrategia de refactorización "Zero-Downtime" (`docs/RENDERER_V3_IMPLEMENTATION_PLAN.md`)
- [x] **Fase 1**: Definición de Contratos e Infraestructura (`core/contract.ts`)
- [x] **Fase 2**: Creación de Wrappers (Legacy Adapters)
- [x] **Fase 3**: Nuevo Orquestador `DiagramRenderer` con DI
- [x] **Fase 4**: Refactorización atómica de componentes (Limpieza de Layout y Providers)
  - [x] Eliminar todos los usos de `any` en los modelos del renderer
  - [x] Implementar Getters polimórficos (`type`, `isAbstract`, `name`) en toda la jerarquía
  - [x] Sincronizar ModelFactory con el contrato IR de `@umlts/engine`
  - [x] Corregir firmas de `updateLayout` para propagación de coordenadas ELK

## Soporte de Renderizado para Notas y Restricciones (UML 2.5.1)

- [x] **FEAT**: Implementación de `UMLNote` y `UMLAnchor` en el modelo visual
- [x] **FEAT**: Soporte de Word Wrap para notas largas en cálculo de dimensiones y SVG
- [x] **FEAT**: Generación de IDs únicos para notas para evitar apilamiento en (0,0)
- [x] **IMPROVEMENT**: Resolución flexible de targets (FQN vs Simple Name) en anclajes
- [x] **IMPROVEMENT**: Inferencia inteligente de Namespace para posicionamiento de notas
- [ ] **BUG**: Duplicidad visual de notas en el renderizado (Deduplicación en IRAdapter requerida)
- [ ] **BUG**: Líneas de anclaje duplicadas (N1 apunta 2 veces a cada clase)
- [ ] **BUG**: Arco XOR mal posicionado o invisible (Detección de nodo común con FQN)
- [x] **FIX**: Renderizado de paquetes estilo "folder" (UML estándar)
- [x] **FEAT**: Visualización de estereotipos en miembros y entidades (Async, Readonly)
- [x] **IMPROVEMENT**: Refinamiento de Layout y Dimensiones (Breathing Room)
  - [x] Implementar IDs determinísticos para aristas (`rel_A_B_Type_N`) para estabilidad de layout.
  - [x] Implementar medición precisa basada en firmas completas de miembros (visibilidad, tipos, params).
  - [x] Sincronizar constantes de medición entre Modelo y Layout (`MEASURE_CONFIG`).
  - [x] Implementar renderizado por capas (Packages -> Edges -> Nodes) para Z-order correcto.
  - [x] Aumentar padding horizontal (50px) y espaciado global para estética "premium".
  - [x] Solucionar bug de truncado de texto en miembros largos (ajuste dinámico de paralelepípedo).

## Backlog para Cumplimiento Estricto UML 2.x (Arquitectura y Parsers)

- [ ] **TASK**: Unificar y normalizar términos de relaciones (Inheritance vs Generalization, Case-sensitivity) y eliminar redundancia en diccionarios de `edges.ts`.
- [ ] **Fase 5**: Implementación de metadatos para interactividad
- [ ] **RESEARCH**: Análisis del estándar UML 2.5.1 sobre Profiles y Stereotypes.
- [ ] **DESIGN**: Definir cómo los estereotipos extienden la semántica de la IR (Intermediate Representation).
- [ ] **FEAT**: Implementar distinción visual y semántica entre `«stereotypes»` (extensión de tipo) y `{constraints}` (reglas lógicas). (Anteriormente RQ 9.3)
- [ ] **FEAT**: Implementar soporte para Notas como Contenedores de Restricciones mediante el estereotipo `«constraint»`. (Anteriormente RQ 11.2)

- [ ] **FEAT**: Soportar Compartimento de Recepciones (`«signal»`) para clases que manejan eventos asíncronos en `IREntity`.
- [ ] **FEAT**: Soportar Compartimentos Dinámicos / Personalizados (ej. Excepciones, Reglas de negocio, Responsabilidades en un bloque extra en la clase).
- [ ] **FEAT**: Soporte a _Tagged Values_ o Propiedades Generales del encabezado de la Clase (ej. `{autor=thot, status=draft}`) en `models.ts` y visualización debajo de los estereotipos.
- [ ] **FEAT**: Soportar Diagramas de Estructura Compuesta (Composite Structure) dentro de Clases Complejas (Ports, Parts, Connectors dentro de los rectángulos).
- [ ] **FEAT**: Variables Derivadas. Soportar el renderizado y parsing del prefijo `/` en propiedades cuyo valor es inferido de otros campos.
- [ ] **FEAT**: Relaciones N-arias (Rombos con múltiple aristas hacia 3+ clases simultáneamente).
- [ ] **FEAT**: Calificadores (Qualifiers) de Asociación. Elementos de matriz integrados al inicio de una arista de relación.
- [ ] **FEAT**: Representar Clases Activas (Active Classes / Threads) estandarizadas mediante un flag activo dibujando bordes verticales con dobles líneas paralelas.
- [ ] **FEAT**: Visualización de Instancias / Objetos en tiempo de ejecución (`anObject : Class`) con el nombre subrayado obligatoriamente por diseño gráfico.

## UML Profiles & Stereotypes (UML 2.5.1)

- [x] **DOC**: Definir arquitectura y consenso de sintaxis (`docs/PROFILES_LOG.md`)
- [x] **DOC**: Crear guías de implementación detalladas para capas Léxica, Sintáctica y Semántica
- [x] **FEAT**: Implementar base del Metamodelo (`UMLMetaclass`) y anclaje en AST
- [x] **FEAT**: Implementar `ProfileRegistry` con soporte para `UMLStandardProfile` (Built-in)
- [x] **CORE**: Inyectar metaclases en `ASTFactory` para todas las entidades y relaciones
- [x] **PHASE 3: LEXICAL**: Actualizar Lexer con tokens `@`, `[]`, `profile`, `stereotype`, `extends`
- [ ] **PHASE 3: SYNTAX**: Implementar `ProfileRule`, `StereotypeRule` y soporte para segmento `[ ]` en entidades
- [ ] **PHASE 4: SEMANTICS**: Implementar validación de Unicidad, Extensión y Esquema de Datos
- [ ] **PHASE 5: RENDERER**: Visualizar estereotipos `« »` y compartimento de metadatos `{ }`

## Backlog de Interoperabilidad (Migración y Exportación)

- [ ] **FEAT**: Diseñar el `XMISerializer` para transformar nuestra estructura de `IRDiagram` en XML compatible con el estándar XMI de MOF/OMG.
- [ ] **FEAT**: Implementación de un generador de IDs determinísticos robustos para el atributo `xmi:id` de todos los componentes mapeados.
- [ ] **FEAT**: Mapeo completo de `IREntity` a elementos `<packagedElement xmi:type="uml:Class">`, y traducción de `IRProperty` y `IROperation` a los bloques contenedores orgánicos de `<ownedAttribute>` y `<ownedOperation>`.
- [ ] **TEST**: Pruebas de integración E2E inyectando el XML generado por UMLTS a herramientas compatibles de mercado para certificar que cargue la topología sin alertar falsos negativos de esquema genérico.
