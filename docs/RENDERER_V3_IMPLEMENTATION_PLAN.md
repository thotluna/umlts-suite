# 🚀 Plan de Refactorización: Renderer V3 (Zero-Downtime)

Para evitar romper el renderizado actual mientras evolucionamos a la arquitectura de **Puertos y Adaptadores**, seguiremos una estrategia de **"Paralelización y Estrangulamiento"**.

## Fase 1: Cimentación de Contratos (No invasiva)

_Objetivo: Definir las reglas del juego sin tocar el código que funciona._

1.  **Definir Interfaces Core**: Crear `packages/renderer/src/core/contract.ts`.
    - `IDataProvider`: Para el suministro de modelos.
    - `ILayoutStrategy`: Para los diferentes tipos de diagramas.
    - `IDrawingEngine`: Para la generación visual (SVG/Canvas).
2.  **Crear el Pipeline Context**: Un objeto que viaje a través de las fases transportando metadatos y el estado del renderizado.

## Fase 2: Implementación de Wrappers (Adaptación)

_Objetivo: Envolver lo viejo en las interfaces nuevas._

1.  **`LegacyIRProvider`**: Envolver la lógica actual de `IRAdapter`.
2.  **`LegacyClassLayout`**: Envolver el `LayoutEngine` actual.
3.  **`LegacySVGEngine`**: Envolver el `SVGRenderer` actual.
    _En este punto, nada ha cambiado en la superficie, pero todo está preparado para ser inyectado._

## Fase 3: El Nuevo Orquestador (`DiagramRenderer`)

_Objetivo: Construir la nueva "carretera" al lado de la vieja._

1.  Crear `DiagramRenderer` que acepte los 3 componentes vía constructor (Inyección de Dependencias).
2.  Implementar el método `render()` en la nueva arquitectura siguiendo el nuevo pipeline (Normalization -> Layout -> Drawing).
3.  **Prueba de Paridad**: Verificar que `DiagramRenderer` (usando los wrappers de la Fase 2) produce exactamente los mismos diagramas que el actual.

## Fase 4: Refactorización Atómica (Puntual)

_Objetivo: Sustituir los wrappers por implementaciones puras._

1.  **Limpiar Layout**: Mover la lógica de pesos de UML fuera de ELK y meterla en una estrategia de clase pura.
2.  **Limpiar Adaptación**: Separar el filtrado de dependencias (ShowDependencies) del orquestador y moverlo al Provider.
3.  **Inyectar Metadatos**: Empezar a meter los IDs únicos en el SVG para la futura interactividad.

## Fase 5: El Cambio de Mando (Switch)

1.  Hacer que el `UMLRenderer` original sea un alias o un wrapper delgado de `DiagramRenderer`.
2.  Eliminar el código "Legacy" que haya quedado huérfano.

---

## 🛠️ Reglas Engorro para "No Tumbar Nada"

- **Tests de Regresión**: Antes de empezar, asegurar que tenemos al menos 3 tests de integración que comparen el string SVG resultante.
- **Doble Entrada**: Durante la transición, los cambios en el modelo (`nodes.ts`) deben ser compatibles con ambos renderizadores.
- **Commits Pequeños**: Un commit por cada interfaz o wrapper implementado.
