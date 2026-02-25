# 🧩 Análisis de Arquitectura del Paquete Renderer

## 1. Bloques de Lego (Componentes Actuales)

El renderizador se organiza como una cadena de montaje de componentes desacoplados:

- **Orquestador (`UMLRenderer`)**: Punto de entrada principal. Coordina la ejecución secuencial de las fases (Adaptación, Layout, Dibujo).
- **Adaptador de IR (`IRAdapter`)**: Transforma el modelo abstracto `IRDiagram` al modelo de dominio rico del renderizador (`DiagramModel`).
- **Motor de Layout (`LayoutEngine`)**: Integra `ELK.js` para calcular la posición de nodos y rutas de aristas.
- **Renderizador SVG (`SVGRenderer`)**: Genera el marcado SVG final basado en el modelo posicionado y el tema visual.
- **Registro de Dibujo (`DrawingRegistry`)**: Sistema de despacho que delega el dibujado de elementos específicos (clases, interfaces, aristas).
- **Elementos Dibujables (`Drawable Elements`)**: Componentes atómicos (p.ej., `class-node`) que contienen la lógica visual específica.

## 2. Objetivos Estratégicos del Refactor (V3)

Para garantizar la evolución del suite, la nueva arquitectura debe soportar:

1.  **Multi-Diagrama y Extensibilidad**: Capacidad para agregar diagramas de secuencia, estado, etc., sin modificar el núcleo del renderer. Esto requiere un sistema de "Plugins de Diagrama" que registren sus propias reglas de layout y componentes visuales.
2.  **Agnosticismo de Entrada (Multi-Source)**: Pasar de un `IRAdapter` rígido a un sistema de `AbstractProviders`. El renderer debe poder consumir tanto el IR interno de UMLTS como modelos estándar UML (XMI) u otras fuentes externas mediante adaptadores enchufables.
3.  **Interactividad (Diagramas Vivos)**: Preparar el terreno para que el SVG no sea solo una imagen estática. La estructura de datos resultante del renderizado debe mantener referencias a los nodos del DOM para permitir manipulaciones (drag & drop, colapso de nodos) en el frontend.

## 3. Violación de Principios y Heurísticas

### SRP (Principio de Responsabilidad Única)

- **`LayoutEngine.ts`**: Está sobrecargado. Gestiona el mapeo a ELK, el cálculo de pesos para la jerarquía, la agrupación por LCA (Lowest Common Ancestor) y la aplicación de resultados.
- **`SVGRenderer.ts`**: Controla la recursividad de paquetes y el renderizado de restricciones lógicas (XOR). Debería centrarse solo en la orquestación del lienzo SVG.

### DIP (Principio de Inversión de Dependencias)

- `UMLRenderer` instancia sus dependencias (`IRAdapter`, `LayoutEngine`, `SVGRenderer`) directamente con `new`. Esto impide la inyectabilidad de diferentes proveedores de datos o motores de dibujo (p.ej., cambiar SVG por Canvas).

### Acoplamiento con Terceros

- La lógica de negocio de UML (pesos de aristas por tipo de herencia/composición) está mezclada con las opciones de configuración de la librería externa `ELK`.

### Lógica de Negocio en Fases Erróneas

- El filtrado de dependencias (`showDependencies`) se está realizando en el orquestador `UMLRenderer`, cuando debería ser responsabilidad de una fase de "Post-Procesamiento" o del `IRAdapter`.

## 4. Heurísticas de Diseño Visual (Pendiente)

- Nodos hijos no heredan propiedades del tema de forma reactiva (acoplamiento manual).
- Cálculo de dimensiones de texto (`measureText`) dependiente de DOM/Canvas externo, lo que dificulta el renderizado en entornos puramente Node.js sin polyfills.
