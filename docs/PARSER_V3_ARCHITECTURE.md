# Arquitectura del Parser UMLTS V3: "The Modular Orchestra"

## 1. Filosofía de Diseño

El Parser V3 se aleja del modelo monolítico y procedimental para adoptar una arquitectura basada en **Descomposición Atómica** y **Composición Dinámica**. El objetivo es que añadir soporte para una nueva sintaxis (ej. un nuevo tipo de entidad o decorador) sea tan simple como registrar una clase, sin tocar el núcleo del parser.

## 2. Patrones de Diseño Aplicados

### A. Pattern: Chain of Responsibility (Reglas de Sentencias)

El `Orchestrator` no conoce los detalles de ninguna regla. Delegará el flujo a una cadena de `StatementRule`s. Cada regla decide si puede manejar el estado actual del `TokenStream`.

- **Beneficio**: Cumple el principio de Abierto/Cerrado. Puedes añadir reglas al final o al principio de la cadena sin modificar el bucle principal.

### B. Pattern: Strategy & Registry (Miembros y Tipos)

Para elementos anidados (atributos, métodos, parámetros), utilizamos un `Registry` de instancias.

- **Mejora V3**: El registro deja de ser estático. Cada instancia de `Parser` tiene su propio `RuleRegistry` inyectado.
- **Inyección de Dependencias**: Los plugins de lenguaje inyectan sus propias estrategias en este registro durante la fase de inicialización.

### C. Pattern: Facade (ParserHub)

El `ParserContext` se divide en una implementación interna pesada y una interfaz ligera (`IParserHub`) que es lo único que ven las reglas.

- **Beneficio**: Blindamos el estado interno del parser. Las reglas no pueden corromper el `TokenStream` de formas no permitidas.

### D. Pattern: Builder / Factory (AST Node Factory)

Las reglas dejan de instanciar objetos literales. Utilizan un `ASTFactory` centralizado.

- **Beneficio**: Si la estructura de los nodos cambia (ej. añadir metadatos globales), solo se cambia en un lugar.

## 3. Componentes del Sistema

### 3.1 Orchestrator (`Parser`)

Es el cerebro táctico. Su única responsabilidad es:

1. Inicializar la sesión de parseo.
2. Ejecutar el bucle principal de sincronización y recuperación de errores.
3. Coordinar el "Panic Mode" delegando en las reglas la búsqueda de puntos seguros.

### 3.2 ParserContext & Session State

El estado deja de ser una mezcla de todo. Se separa en:

- **TokenStream**: Navegación pura (Cursor, Lookahead, Splitting).
- **DiagnosticReporter**: Recolección de errores reactiva.
- **StateStore**: Pequeño almacén para metadatos temporales (ej. `pendingDocs`) que se limpia automáticamente tras cada sentencia exitosa o fallo.

### 3.3 Rule Hierarchy (Estructura de Archivos)

Cada archivo tiene una única responsabilidad:

- `rules/core/`: Reglas fundamentales de UML (Package, Entity, Relationship).
- `rules/members/`: Estrategias para contenido interno de entidades.
- `rules/plugins/`: Puntos de entrada para lógica específica de lenguajes (Java, TypeScript).

## 4. Flujo de Extensibilidad (Abierto/Cerrado)

Para extender el parser, un desarrollador sigue estos pasos:

1. Crea una nueva clase que implemente `StatementRule` o `IMemberProvider`.
2. Implementa `canStart()` (Heurística rápida).
3. Implementa `parse()` (Consumo de tokens y generación de nodos).
4. Registra la instancia en la `ParserFactory`.

**Cero modificaciones en `parser.ts` o `entity.rule.ts`.**

## 5. Ejemplo de Estructura de Paquetes Sugerida

```text
src/parser/
├── core/
│   ├── parser.ts                 # Orchestrator
│   ├── parser.context.ts         # Internal Context
│   └── parser.hub.ts             # IParserHub Interface
├── factory/
│   ├── parser.factory.ts         # Composition Root
│   └── ast.factory.ts            # Node creation logic
├── rules/
│   ├── base/
│   │   ├── statement.rule.ts     # Interface & Base Class
│   │   └── member.provider.ts    # Interface & Base Class
│   ├── structural/
│   │   ├── package.rule.ts
│   │   ├── entity.rule.ts        # Slim version (only logic for entity shell)
│   │   └── enum.rule.ts          # Separated!
│   └── members/
│       ├── attribute.strategy.ts
│       └── method.strategy.ts
└── providers/
    └── ts-plugin/                # Plugin logic separated by language
        ├── ts-member.provider.ts
        └── ts-type.rule.ts
```

## 6. Manejo de Errores y Recuperación

El parser implementa un sistema de **Sincronización por Contrato**:

- Si una regla falla, lanza un `SyntaxError` específico.
- El `Orchestrator` captura el error y activa el método `sync()` del contexto.
- `sync()` utiliza las heurísticas de `canStart()` de todas las reglas registradas para encontrar el próximo punto de inicio válido (ej. saltar hasta el siguiente `class` o `package`).
