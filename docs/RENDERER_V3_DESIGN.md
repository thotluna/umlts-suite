# 🏥 Plan de Diseño: Renderer V3 (The Living Diagram)

Este documento esboza la arquitectura propuesta para resolver las limitaciones identificadas en el análisis.

## 1. Arquitectura de "Puertos y Adaptadores" (Hexagonal)

El Renderer dejará de ser una cadena lineal rígida para convertirse en un núcleo de orquestación con puntos de extensión claros.

### A. Puertos de Entrada (`DataProviders`)

- **`IUMLModelProvider`**: Interfaz común para traducir cualquier fuente (IR, XMI, JSON) a un `DiagramModel` neutral.
- **`InternalIRProvider`**: Adaptador para el motor UMLTS actual.
- **`StandardUMLProvider` (Futuro)**: Adaptador para archivos `.xmi`.

### B. Núcleo de Transformación (`The Pipeline`)

El proceso se dividirá en micro-pasos (Stages):

1.  **Normalization**: Limpieza y filtrado inicial (ej: ocultar dependencias).
2.  **Archetyping**: Asignación de "estilos de layout" basados en el tipo de diagrama.
3.  **Negotiation**: Cálculo de dimensiones (Text Measurement).
4.  **Placement**: Ejecución de estrategias de layout.

### C. Estrategias de Layout (`LayoutRegistry`)

En lugar de un `LayoutEngine` monolítico, tendremos estrategias inyectables:

- **`ClassDiagramStrategy`**: Optimizada para jerarquías y herencia.
- **`SequenceDiagramStrategy`**: Optimizada para líneas de vida y mensajes.
- **`StateDiagramStrategy`**: Optimizada para grafos cíclicos.

### D. Motores de Visualización (`SceneEngines`)

El resultado del layout se entrega a un motor de dibujado:

- **`SVGEngine`**: Genera el string SVG (actual).
- **`InteractiveSVGEngine`**: Genera el SVG con Handlers de eventos para drag & drop.
- **`CanvasEngine` (Futuro)**: Para diagramas masivos que requieran rendimiento.

---

## 2. El Modelo de "Diagrama Vivo" (Stateful)

Para permitir que el usuario mueva elementos, el renderer debe devolver un objeto `RenderedDiagram` que contenga:

1.  **The Scene Graph**: Un árbol de elementos con sus coordenadas y estados.
2.  **The Mapper**: Un mapa que vincula IDs de elementos UML con sus representaciones en el DOM.
3.  **Update API**: Métodos para re-calcular rutas de aristas cuando un nodo se mueve sin disparar un layout completo (Incremental Update).

---

## 3. Hoja de Ruta de Implementación

1.  **Sprint 1: Abstracción del Orquestador**. Implementar `UMLRenderer` con inyección de dependencias.
2.  **Sprint 2: Desacoplamiento de ELK**. Mover la lógica de pesos y agrupación a una `ClassLayoutStrategy`.
3.  **Sprint 3: Normalización de Modelos**. Crear el primer `DataProvider` para limpiar el adaptador actual.
4.  **Sprint 4: Capa de Interactividad**. Inyectar IDs únicos y metadatos en las etiquetas SVG para facilitar el acceso desde JS externo.
