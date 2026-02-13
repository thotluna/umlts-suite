# Proyecto: UMLTS VS Code Extension

Extensión para brindar soporte de lenguaje y visualización al DSL UMLTS.

## Roadmap de Implementación

### Fase 1: Scaffolding y Configuración

- [x] Estructura de carpetas inicial
- [x] Configuración de `package.json` y `tsconfig.json`
- [x] Vinculación con `ts-uml-engine`
- [x] Implementación de Syntax Highlighting básico (TextMate)

### Fase 2: Soporte de Lenguaje (LSP Lite)

- [x] Diagnósticos en tiempo real usando el motor
- [x] Autocompletado de Keywords y Entidades
- [x] Hovers con información semántica (Básico)

### Fase 2.1: Mejoras en Hovers y Documentación

- [x] Revisar actualizaciones de documentación en `ts-uml-engine`
- [x] Integrar soporte de JSDoc en el servidor LSP (listo para cuando el motor lo provea)
- [x] Corregir resolución de módulo `umlts` vinculando al motor actualizado
- [x] Limpieza de archivos `.js` fantasma en el código fuente del servidor

### Tareas de Mantenimiento

- [x] Crear commits para los cambios pendientes

### Fase 3: Visualización

- [ ] Definir arquitectura extensible (Visitor + Strategy)
- [ ] Implementar Mapper de AST a Modelo de Diagrama
- [ ] Integración con Webview para renderizado Mermaid
- [ ] Implementar algoritmo de layout para evitar ensolapamiento ( Sugiyama / ELK)
- [ ] Sincronización automática entre código y diagrama
