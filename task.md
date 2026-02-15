# UMLTS Suite - Project Tracking

## 🚀 Fixes Urgentes (Completados)

- [x] **Precisión Diagnóstica**: Los errores semánticos ahora subrayan la línea y columna exactas.
- [x] **Subrayado Completo**: El resaltado de errores cubre la palabra completa del identificador problemático.
- [x] **Higiene de IR**: Bloqueo de creación de entidades o relaciones ilegales (ej. asociaciones a paquetes).
- [x] **Namespace Safety**: Prevención de colisiones de nombres entre Paquetes y Clases (explícitas o implícitas).
- [x] **Unificación de Relaciones**: `>` y `<>` ahora se manejan consistentemente como asociaciones.
- [x] **Flechas Abiertas**: Implementación de `><` para asociaciones dirigidas.
- [x] **Metadatos Visuales**: Corrección del renderizado de etiquetas y multiplicidad en el generador.

## 📋 Proóximas Funcionalidades (Backlog)

- [ ] **Association Classes**: Soporte para clases de asociación mediante simbología de rombo o línea punteada.
- [ ] **Advanced Autocomplete**: Sugerencias inteligentes basadas en el `SymbolTable` actual.
- [ ] **Research: XMI/UMLDI**: Investigar estándares de interoperabilidad para exportación a otras herramientas UML.
- [ ] **Reverse Engineering**: Refactorización para permitir la generación de diagramas a partir de código fuente TS/Java.

## 🐛 Bugs Conocidos

- [ ] **Visual Loops**: El ruteo de herencia forzado (N->S) puede generar bucles visuales innecesarios en layouts muy densos.
- [ ] **Layout Complexity**: Optimización del enrutamiento ortogonal en diagramas con alta densidad de cruces.

## ✅ Cumplimiento UML 2.5.1 (Roadmap)

- [x] **Acyclic Hierarchies**: Validación de no existencia de herencia circular.
- [x] **Multiplicity Consistency**: Validación de que una parte no puede pertenecer a más de un composite (<= 1).
- [x] **Namespace Uniqueness**: Garantía de nombres únicos dentro de un mismo scope.
- [x] **Structural Integrity**: Validación de que Enums e Interfaces no pueden ser "Whole" en composiciones.
- [x] **Classifier Validation**: Prohibición estricta de asociaciones o herencias dirigidas a un Paquete.
- [ ] **Inheritance Modifiers**: Soporte y validación para `leaf`, `final`, y `root`.
- [ ] **Redefinition & Subsets**: Capacidad de definir que una propiedad redefine o es subconjunto de otra.
- [ ] **Derived Properties**: Soporte para la sintaxis `/propiedad` y su lógica de validación.
- [ ] **Components & Ports**: Implementación de puertos físicos y conectores en límites de componentes.
- [ ] **Generalization Sets**: Agrupación de herencias con restricciones `{complete, disjoint}` y soporte para Powertypes.
