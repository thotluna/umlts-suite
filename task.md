# Proyecto UMLTS - Seguimiento de Tareas

## 🚀 Fixes y Mejoras Recientes (Completado)

- [x] **Unificación de Relaciones**: `>` y `<>` ahora funcionan consistentemente.
- [x] **Asociación Dirigida**: Implementación del operador `><` (punta de flecha abierta).
- [x] **Precisión de Errores**: Los diagnósticos ahora subrayan la palabra exacta y en la posición correcta (0-based en VS Code).
- [x] **Higiene Semántica**: El motor bloquea asociaciones ilegales a Paquetes y colisiones de nombres.
- [x] **Metadatos Visuales**: Corrección en el renderizado de etiquetas y multiplicidad.

## 📋 Backlog (Próximas Funcionalidades)

- [ ] **Association Classes**: Representación de clases de asociación mediante simbología estándar.
- [ ] **Research: XMI/UMLDI**: Investigación sobre estándares de intercambio de modelos.
- [ ] **Advanced Autocomplete**: Sugerencias basadas en los tipos definidos en el `SymbolTable`.
- [ ] **Reverse Engineering**: Generación de diagramas a partir de archivos TypeScript/Java.

## 🐛 Bugs

- [x] Posicionamiento erróneo de diagnósticos semánticos (Hardcoded en línea 1).
- [x] Colisión de nombres entre Paquetes y Clases implícitas.
- [ ] **Visual Routing**: El enrutamiento forzado N->S genera bucles en layouts densos.
- [ ] **Layout Overlap**: Optimización de cruces de líneas en diagramas complejos.

## ✅ Roadmap UML 2.5.1

- [x] **Acyclic Hierarchies**: Validación de no existencia de herencia circular.
- [x] **Multiplicity Consistency**: Validación de composición (partes <= 1 dueño).
- [x] **Namespace Uniqueness**: Garantía de nombres únicos por scope/paquete.
- [x] **Structural Integrity**: Enums e Interfaces no pueden ser contenedores en composiciones.
- [x] **Classifier Validation**: Prohibición de relaciones estructurales con Paquetes.
- [ ] **Modifiers**: Soporte y validación para `leaf`, `final`, y `root`.
- [ ] **Redefinition & Subsets**: Lógica para propiedades que redefinen a otras.
- [ ] **Derived Properties**: Soporte para sintaxis `/propiedad`.
- [ ] **Components & Ports**: Implementación de puertos y conectores.
- [ ] **Generalization Sets**: Agrupaciones `{complete, disjoint}` y Powertypes.
