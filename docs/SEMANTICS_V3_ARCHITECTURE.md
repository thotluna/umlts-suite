# Arquitectura del Análisis Semántico (V3)

## Descripción General

La Fase Semántica es la etapa del pipeline del compilador donde el Árbol de Sintaxis Abstracta (AST) generado por el Parser se transforma en la Representación Intermedia (IR). Esta fase es responsable de validar las reglas de UML, resolver símbolos e inferir tipos.

La arquitectura sigue un patrón de **Pipeline de 3 Pases**, desacoplado de la lógica de navegación de tokens del Parser, asegurando un entorno de validación y construcción de modelos puro.

## Estructura de Carpetas y Responsabilidades

| Directorio   | Responsabilidad                                                                                                                |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------- |
| `analyzers`  | Agentes especializados que transforman nodos específicos del AST en elementos de la IR (Entidades, Relaciones, Restricciones). |
| `inference`  | Motor de inferencia encargado de deducir tipos y miembros basándose en el contexto y los plugins de lenguaje.                  |
| `passes`     | Implementación del pipeline de 3 pases: **Discovery**, **Definition** y **Resolution**.                                        |
| `resolvers`  | Recolectores y vinculadores para conceptos complejos de UML que requieren un enlace especial (ej: Association Classes).        |
| `rules`      | Heurísticas lógicas y reglas semánticas utilizadas por el motor de inferencia y los validadores.                               |
| `session`    | Contenedor de estado volátil: Tabla de Símbolos, Registro de Restricciones y Almacén de Configuración.                         |
| `utils`      | Herramientas de soporte horizontal: construcción de FQN, validación de sintaxis de tipos y multiplicidades.                    |
| `validators` | Guardianes de la integridad estructural (Ciclos de herencia, consistencia de agregaciones).                                    |
| `core`       | Abstracciones y contratos base para la fase semántica (Capa de desacoplamiento).                                               |

---

## El Pipeline Semántico

La ejecución es orquestada por el `SemanticAnalyzer` a través de una secuencia de pases y procesos coordinados:

### 1. Inicialización (`session`)

- **Configuración**: Crea una nueva `SymbolTable` (para mapear IDs a entidades), un `ConstraintRegistry` (para reglas lógicas) y un `ConfigStore` (para manejar plugins y contexto de lenguaje).
- **Contexto**: Envuelve estos elementos en una `AnalysisSession` que representa la "memoria" del análisis actual.

### 2. Pase 1: Discovery (`passes/discovery`)

- **Objetivo**: Identificación general de todos los clasificadores.
- **Proceso**: Escanea el AST buscando clases, interfaces y enums. Registra sus Nombres Completamente Cualificados (FQN) en la `SymbolTable`.
- **Resultado**: Un mapa completo de "quién existe" en el sistema, incluso si aún no conocemos su contenido.

### 3. Pase 2: Definition (`passes/definition`)

- **Objetivo**: Análisis profundo de las entidades.
- **Proceso**: Para cada entidad registrada, analiza su cuerpo (Atributos y Métodos).
- **Registro Implícito**: Si un miembro hace referencia a un tipo que no fue descubierto en el Pase 1, el `EntityAnalyzer` lo registra como una "Entidad Implícita" (permitiendo la flexibilidad del DSL).

### 4. Pase 3: Resolution (`passes/resolution`)

- **Objetivo**: Establecer vínculos y conexiones.
- **Proceso**: Analiza las relaciones entre entidades (Herencia, Asociaciones). Resuelve nombres relativos a FQNs y valida que las conexiones sigan las reglas de UML 2.5.1.
- **Vinculación**: Conecta las Association Classes y resuelve restricciones complejas (como bloques XOR).

### 5. Inferencia de Tipos y Refinamiento (`inference`)

- **Heurísticas**: Si se configura un lenguaje como TypeScript, el motor `MemberInference` ejecuta reglas para promover entidades genéricas `DataType` a `Class` o `Interface` basándose en su uso.
- **Plugins**: Consulta los plugins de lenguaje para mapeos de tipos específicos (ej: `string` -> `String`).

### 6. Validación de Integridad (`validators`)

- **Chequeo Profundo**: Ejecuta validaciones finales que requieren el grafo completo.
- **Reglas**: Detección de ciclos en la herencia, consistencia de multiplicidad (`upper >= lower`) y restricciones de agregación estructural.

### 7. Exportación de IR (`session/toIRDiagram`)

- **Paso Final**: La `AnalysisSession` colapsa su estado interno en un objeto estático `IRDiagram`, listo para el Generador o el Renderer.

---

## Principios de Diseño

1. **Independencia del Parser**: La fase semántica NO debe conocer sobre `TokenType` o `lookahead`. Opera sobre nodos del AST y reporta errores a través de un `ISemanticContext` neutral.
2. **Lógica sin Estado (Stateless)**: Los analizadores y validadores son sin estado; reciben la `AnalysisSession` o el `SemanticContext` para realizar su trabajo.
3. **DSL sobre Rigidez**: El sistema favorece el "Registro Implícito" permitiendo a los usuarios bocetar rápido, mientras la fase semántica trabaja en segundo plano para hacer que el modelo sea consistente.
