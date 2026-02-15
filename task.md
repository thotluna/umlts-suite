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
  - Problema: En `arquitectura_motor.umlts` línea 135, `- relationships: >+ IRRelationship[]` muestra `IRRelationship` como clase en el diagrama, pero es una interfaz.
  - Causa: El SemanticAnalyzer no propaga el tipo de entidad (interface vs class) cuando crea relaciones implícitas desde atributos.
  - Solución propuesta: Extender la lógica de `resolveOrRegisterImplicit` para consultar el tipo real de la entidad referenciada y preservarlo en la entidad implícita.
- [x] **BUG**: Múltiples relaciones al mismo tipo con roles diferentes solo renderiza una
  - Problema: En `DiagramNode` hay dos atributos (`attributes: >* IRMember` y `methods: >* IRMember`) que apuntan al mismo tipo con roles diferentes, pero el diagrama solo muestra la relación "attributes".
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

## Evolución Arquitectónica (Renderer V2)

- [x] Segregación del Core (`contract/` vs `model/`)
- [x] Transformación a Modelo de Dominio Rico (Clases `UMLNode`, `UMLEdge`)
- [x] Implementación de `SVGBuilder` y Patrón de Dibujo Desacoplado
- [x] Formalización del Orquestador de Pipeline (`UMLRenderer`)
- [x] Abstracción de Jerarquía (`UMLHierarchyItem`) para soporte agnóstico de contenedores
- [x] Corrección de Bug de Layout Jerárquico (Offsets de aristas y proporciones)

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
- [x] **FIX**: Mejora de resolución FQN con mecanismo "Global Scout"
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
- [x] **FEAT**: Implementación completa de Relación de Asociación
  - [x] Unidireccional: Token `><` (`OP_ASSOC`)
  - [x] Bidireccional: Token `<>` (`OP_ASSOC_BIDIR`)
  - [x] Actualización de documentación en Skills (`SKILL.md`)
  - [x] Corrección de Tests Unitarios (`lexer.test.ts`)
  - [x] **CHORE**: Migración de build del motor a formato Dual (CJS + ESM) usando `tsup`

## Próximos Pasos (V3)

- [ ] Explorar soporte para Association Classes
- [ ] Implementar autocompletado avanzado basado en la nueva resolución FQN
- [ ] **RESEARCH**: Interoperabilidad Estándar (OMG XMI & UMLDI)
  - [ ] Investigar especificación XMI 2.5.1 para serialización del modelo semántico (Entities, Relations)
  - [ ] Investigar UMLDI (Diagram Interchange) para persistencia de layout (Posiciones, Rutas)
  - [ ] Evaluar viabilidad de exportador XMI para compatibilidad con Enterprise Architect/MagicDraw

## Ingeniería Inversa Blueprint (Extractor v1.0)

- [x] **FEAT**: Create `@umlts/blueprint` package structure
- [x] **FEAT**: Implement `BlueprintExtractor` based on `ts-morph`
- [x] **FEAT**: Support for Inheritance, Realization, Association, Aggregation, and Composition
- [x] **FEAT**: Implement Dependency detection (`>-`) via AST analysis of method bodies
- [x] **DOC**: Document relationship heuristics (Visibility, Versatility, Momentarity)
- [x] **IMPROVEMENT**: "Surgeon Effect" (Public Getters) and Global Versatility Map
- [x] **IMPROVEMENT**: Refine FQN resolution in blueprint using actual file imports
- [x] **IMPROVEMENT**: Add CLI support for blueprint to generate `.umlts` files from terminal
- [x] **IMPROVEMENT**: Sanitización de identificadores (keywords) y limpieza de tipos complejos (generics, Object, Function)

## Ingeniería Inversa Quirúrgica (Surgeon Extractor)

- [x] **TASK**: Definir workflow de extracción manual en `.agent/workflows/surgeon-extractor.md`
- [x] **FEAT**: Implementar Pasada -1 (Configuración)
  - [x] Lectura de `tsconfig.json` para resolución de Aliases (Heurística inicial implementada)
  - [x] Mapeo de paquetes basado en estructura de carpetas de monorepo
- [x] **FEAT**: Implementar Pasada 0 (Imports & Scope)
  - [x] Escaneo de cabeceras para mapeo de FQNs vía imports
  - [x] Identificación de dependencias externas (Shadowing)
- [x] **FEAT**: Implementar Pasada 1 (Órganos)
  - [x] Extracción de entidades (class/interface)
  - [x] Mapeo de atributos estructurales para composición/agregación
- [x] **FEAT**: Implementar Pasada 2 (Síntesis & Cirujano)
  - [x] Escaneo de firmas de métodos para dependencias de uso
  - [x] Aplicación del _Surgeon Effect_ (No duplicar líneas si hay relación estructural)
- [x] **TEST**: Validar extracción del paquete `engine/semantics` sin ruido visual y compilación Exitosa (Verificado con CLI)
- [x] **FIX**: Corregir "ruido" en extracción de miembros (evitar capturar parámetros de métodos como propiedades)
- [x] **IMPROVEMENT**: Implementar resolución FQN basada en imports para evitar duplicidad de clases en el diagrama
