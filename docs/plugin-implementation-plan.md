# Plan de Implementación: Arquitectura de Plugins

Este documento detalla los pasos secuenciales para implementar la nueva arquitectura de plugins descentralizada en el `@umlts/engine`, asegurando la estabilidad del sistema y permitiendo revisiones pequeñas y controladas.

## Fase 1: Definición de Contratos (Interfaces)

**Objetivo:** Establecer el lenguaje común entre el motor y los plugins sin alterar el código existente.

1.  Crear directorio `packages/engine/src/plugin/` (Infraestructura de conexión del motor).
2.  Definir `IUMLPlugin` y `ICapability` en: `packages/engine/src/plugin/plugin.types.ts`.
3.  Definir `ILanguageCapability` e `ILanguageAPI` en: `packages/engine/src/plugin/language.types.ts`.
4.  Exportar estos tipos desde: `packages/engine/src/index.ts`.

## Fase 2: Gestión de Infraestructura (PluginRegistry)

**Objetivo:** Crear el componente interno que orquestará la vida de los plugins.

1.  Implementar `PluginRegistry` en: `packages/engine/src/plugin/plugin.registry.ts`.
2.  Implementar la lógica de validación (máximo 1 plugin por capacidad) dentro del Registry.
3.  Implementar la lógica de "Lazy Loading" para activar capacidades bajo demanda.
4.  Añadir tests unitarios en: `packages/engine/src/plugin/__test__/plugin.registry.test.ts`.

## Fase 3: Integración en el Motor (UMLEngine)

**Objetivo:** Habilitar la entrada de plugins al flujo principal.

1.  Actualizar el constructor en: `packages/engine/src/UMLEngine.ts` para incluir `plugins?: IUMLPlugin[]`.
2.  Instanciar el `PluginRegistry` dentro de `UMLEngine`.
3.  Asegurar que si no hay plugins, el motor siga en "UML Puro" (comprobado en tests de regresión).

## Fase 4: Punto de Extensión Léxica (Lexer)

**Objetivo:** Permitir que los plugins inyecten nuevos símbolos.

1.  Modificar `LexerFactory` en: `packages/engine/src/lexer/lexer.factory.ts` para inyectar el Registry.
2.  Actualizar `MasterMatcher` en: `packages/engine/src/lexer/matchers/master.matcher.ts` para priorizar matchers de plugins.
3.  Test de integración en: `packages/engine/src/lexer/__test__/lexer.plugin.test.ts`.

## Fase 5: Punto de Extensión Sintáctica (Parser)

**Objetivo:** Permitir que los plugins extiendan la gramática.

1.  Actualizar `IParserHub` y su implementación en: `packages/engine/src/parser/core/parser.hub.ts`.
2.  Modificar `ParserFactory` en: `packages/engine/src/parser/parser.factory.ts`.
3.  Actualizar reglas clave: `packages/engine/src/parser/rules/type.rule.ts` y `packages/engine/src/parser/rules/member-suffix.rule.ts`.

## Fase 6: Infraestructura Semántica y Resolución de Tipos

**Objetivo:** Permitir que los plugins controlen la semántica de tipos y el lenguaje.

1.  Implementar `TypeResolutionPipeline` en: `packages/engine/src/semantics/inference/type-resolution.pipeline.ts`.
2.  Refactorizar `SymbolTable` para eliminar tipos hardcodeados y permitir registro dinámico en `DiscoveryPass`.
3.  Implementar `ITypeResolutionStrategy` para permitir lógicas de resolución personalizadas (ej. Mapped Types).
4.  Inyectar el pipeline en `AnalysisSession`, `EntityAnalyzer` y `RelationshipAnalyzer`.
5.  Actualizar `LanguageExtension` para centralizar estrategias y tipos primitivos registrados.

## Fase 7: Implementación del Plugin de Referencia (@umlts/plugin-ts)

**Objetivo:** Desplegar un plugin de lenguaje completo que explote todos los puntos de extensión.

### 7.1: Estructura y Contrato

1.  Inicializar `packages/plugin-ts/` con soporte para `pnpm workspaces`.
2.  Implementar la clase maestra `TypeScriptPlugin` que hereda de `IUMLPlugin`.
3.  Configurar el método `getCapability('language')` para devolver una instancia de `TSLanguageCapability`.

### 7.2: Extensión del Léxico (Tokens)

1.  Registrar `matchers` para palabras clave específicas de TS (ej: `readonly`, `type`, `interface`, `namespace`).
2.  Asegurar que los matchers de TS tengan prioridad sobre los genéricos mediante la orquestación en `LexerFactory`.

### 7.3: Extensión de la Gramática (Rules)

1.  Implementar `TypeScriptStatementRules`: soporte para bloques `namespace` o `type alias` utilizando `IParserHub`.
2.  Implementar `TypeScriptMemberProviders`: lógica para parsear modificadores de acceso específicos o decoradores.

### 7.4: Dominio Semántico (Tipos y Resolución)

1.  **Registro de Primitivas:** Inyectar tipos nativos (`any`, `unknown`, `never`, `void`, `Record`, `Partial`, etc.) a través de `ILanguageAPI.addPrimitiveType`.
2.  **Estrategias de Resolución:**
    - Implementar `TSGenericResolutionStrategy` para manejar la descomposición de utilidades como `Array<T>` o `Promise<T>`.
    - Implementar `TSMappedTypeStrategy` para resolver tipos derivados de objetos.
3.  **Reglas de Validación:** Registrar `ISemanticRule` personalizadas (ej: prohibir herencia múltiple de clases, pero permitir interfaces).

### 7.5: Distribución e Integración

1.  Configurar `@umlts/engine` como `peerDependency` para evitar duplicidad de instancias en el `PluginRegistry`.
2.  Vincular el plugin en la fachada `UMLEngine` mediante la configuración de `BUILTIN_PLUGINS`.

---

**Nota sobre Estructura:**

- `packages/engine/src/plugin/`: Contiene EXCLUSIVAMENTE la infraestructura para que el motor acepte cualquier plugin (interfaces y registro).
- `packages/plugin-*/`: Son paquetes autónomos y desacoplados que implementan las capacidades para cada lenguaje o herramienta específica.

**Regla de Oro:** Cada paso debe mantener los tests existentes en verde y no debe introducir cambios de comportamiento para los usuarios que no usan plugins.

---

**Nota sobre Estructura:**

- `packages/engine/src/plugin/`: Contiene EXCLUSIVAMENTE la infraestructura para que el motor acepte cualquier plugin (interfaces y registro).
- `packages/plugin-*/`: Son paquetes autónomos y desacoplados que implementan las capacidades para cada lenguaje o herramienta específica.

**Regla de Oro:** Cada paso debe mantener los tests existentes en verde y no debe introducir cambios de comportamiento para los usuarios que no usan plugins.
