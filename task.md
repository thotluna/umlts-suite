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
- [ ] **BACKLOG**: Repasar casos de genéricos (errores de concepción y renderizado)

- [x] **BUG**: Corregir redundancia de atributos (no mostrar en cajetín si existe relación visual)
    - [x] Análisis arquitectónico (Opción A seleccionada)
    - [x] Extender `IRRelationship` con campo `visibility`
    - [x] Modificar `SemanticAnalyzer` para propagar visibilidad
    - [x] Implementar fase de "Deduplicación" en `SemanticAnalyzer`
    - [x] Adaptar renderer (si aplica) para mostrar visibilidad en roles
- [x] **BUG**: Etiquetas de roles se cortan en el renderizado (ej: `+ representación` -> `+ represent`)
- [x] **BUG**: Fallo al nombrar una clase abstracta en línea (reportado por usuario)
- [x] **FEAT**: Implementación completa de Clases Estáticas y Activas
- [ ] **BUG**: El botón de exportar en la extensión (Preview) no funciona
- [x] Bug: Las relaciones se renderizan en (0,0) (como líneas huérfanas arriba a la izquierda).
  - Causa: ELK usa coordenadas relativas al contenedor, pero el renderizado SVG asume absolutas. Faltaba resolver los offsets jerárquicos de las aristas.
  - Solución: Implementada resolución recursiva de offsets de aristas y distribución por LCA.
- [x] **BUG**: Diagrama desconectado / Nodos fantasmas en arquitectura.
  - Causa: `SymbolTable` no resolvía nombres con puntos de forma relativa.
  - Solución: Corregida lógica de `resolveFQN` y actualizado script de arquitectura.
- [ ] **BUG**: Interfaces en relaciones de atributos se renderizan como clases
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
- [ ] **TASK**: Login en NPM
- [ ] **TASK**: Configurar tokens de acceso (si es necesario)
- [ ] **TASK**: Verificar permisos de publicación

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
