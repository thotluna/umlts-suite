# Backlog

- [ ] Soporte para **Association Classes**- [x] Unificar `>` y `<>` como asociaciones bidireccionales (línea simple).
- [x] Implementar `><` como asociación dirigida (punta de flecha abierta).
- [x] Corregir renderizado de etiquetas y multiplicidad en relaciones.
- [x] **Fix Urgente: Posicionamiento de errores semánticos** (ahora subrayan la línea correcta).
- [x] **Fix Urgente: Precisión de subrayado** (el subrayado ahora cubre la palabra completa).
- [x] **Fix Urgente: Higiene de IR** (bloquear creación de entidades/relaciones ilegales con paquetes).

## Backlog

- [ ] **Association Classes** (Clases de asociación mediante rombo o línea punteada).
- [ ] **Research: XMI/UMLDI** (Interoperabilidad con otras herramientas).
- [ ] **Advanced Autocomplete** (Sugerencias basadas en el SymbolTable).
- [ ] **Refactoring: Reverse Engineering** (Generación de diagramas desde código TS/Java).

## Bugs

- [x] Posicionamiento erróneo de diagnósticos semánticos (Hardcoded en línea 1).
- [x] Colisión de nombres entre Paquetes y Clases implícitas.
- [ ] El ruteo de herencia a veces genera loops visuales en layouts complejos.

## Cumplimiento UML 2.5.1 (Roadmap)

- [x] **Acyclic Hierarchies** (No herencia circular).
- [x] **Multiplicity Consistency** (Composición <= 1).
- [x] **Namespace Uniqueness** (No duplicados en el mismo scope).
- [x] **Structural Integrity** (Enums e Interfaces no pueden ser "Whole" en composiciones).
- [x] **Classifier Validation** (Prohibir asociaciones/herencia con Paquetes).
- [ ] **Modifiers: leaf, final, root** (Soportar y validar modificadores de herencia).
- [ ] **Redefinition & Subsets** (Poder decir que una propiedad redefine a otra).
- [ ] **Derived Properties** (Sintaxis `/propiedad` y validación).
- [ ] **Components & Ports** (Implementación de puertos físicos en límites de caja).
- [ ] **Generalization Sets** (Poder agrupar herencias con etiquetas como `{complete, disjoint}`).
- [ ] **FEAT**: Soporte para **Generalization Sets** (Disjoint/Complete) y Powertypes.

# Bugs

- [ ] **FIX**: Ruteo de aristas de herencia forzado a N->S provoca bucles innecesarios en algunos layouts complejos en proyectos grandes.
