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

## Fase 6: Cierre Semántico y Validación Inicial

**Objetivo:** Inyectar tipos base y validación básica.

1.  Actualizar el registro de tipos en: `packages/engine/src/semantics/passes/resolution.pass.ts`.
2.  Crear plugin de prueba interno `TS-Lite` para validar el pipeline.

## Fase 7: Creación del Primer Plugin Externo (@umlts/plugin-ts)

**Objetivo:** Implementar el primer plugin real como un paquete independiente.

1.  Inicializar directorio `packages/plugin-ts/` con su propio `package.json`, `tsconfig.json` y `vitest.config.ts`.
2.  Configurar la dependencia hacia `@umlts/engine` (como peerDependency o devDependency para los tipos).
3.  Implementar la lógica real de TypeScript (Matchers, Rules, Modificadores) moviéndola desde el motor si existiera alguna lógica previa.
4.  Publicar/Vincular para pruebas en la aplicación Host (ej. VS Code).

---

**Nota sobre Estructura:**

- `packages/engine/src/plugin/`: Contiene EXCLUSIVAMENTE la infraestructura para que el motor acepte cualquier plugin (interfaces y registro).
- `packages/plugin-*/`: Son paquetes autónomos y desacoplados que implementan las capacidades para cada lenguaje o herramienta específica.

**Regla de Oro:** Cada paso debe mantener los tests existentes en verde y no debe introducir cambios de comportamiento para los usuarios que no usan plugins.
