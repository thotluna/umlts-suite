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
- [ ] **BUG**: Fallo al nombrar una clase abstracta en línea (reportado por usuario)
- [ ] **FEAT**: Implementación completa de Clases Activas (Pendiente de completar)

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
