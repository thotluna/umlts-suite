# ⚡ Implementación: Eventos Asíncronos (Signals & Receptions)

Este documento define la arquitectura y sintaxis para soportar la asincronía y el manejo de eventos en UMLTS, conforme al estándar UML 2.5.1, priorizando el uso de la gramática actual sin añadir nuevos tokens.

## 🎯 Elementos del Modelo

### 1. Signals (Señales)

Representan la definición de un evento asíncrono que transporta datos.

- **Sintaxis DSL**: `@signal class Name { attr: Type }`
- **Metamodelo**: `UML::Signal` (Especialización de `Classifier`).

### 2. Receptions (Recepciones)

Indican que una clase está preparada para procesar una señal específica.

- **Sintaxis DSL**: `@receive onSignal(param: Type)`
- **Metamodelo**: `UML::Reception`.

### 3. Active Classes (Clases Activas)

Clases que poseen su propio hilo de ejecución.

- **Sintaxis DSL**: `& class Name { ... }`
- **Metamodelo**: Propiedad `isActive: Boolean` en `UML::Class`.

### 4. Send Relationships (Relaciones de Envío)

Modelan el acto de disparar o enviar una señal.

- **Sintaxis DSL**: `Source >- Target @send`
- **Metamodelo**: `UML::Usage` con estereotipo `«send»`.

---

## 🛠️ Guía de Implementación Paso a Paso

### 📦 Paso 1: Preparación de la Representación Intermedia (IR)

Modificar `packages/engine/src/generator/ir/models.ts` para que el contrato entre el motor y el renderer incluya los nuevos conceptos.

1.  **Definir `IRReception`**: Crear una interfaz que contenga `name` y `parameters: IRParameter[]`.
2.  **Extender `IREntity`**: Añadir la propiedad opcional `receptions?: IRReception[]`.
3.  **Extender `IROperation`**: Asegurar que tenga `isAsync: boolean` (ya debería estar para soportar `@async`).

### 🏷️ Paso 2: Registro de Estereotipos Base

Actualizar `packages/engine/src/semantics/profiles/profile.registry.ts` para formalizar los estereotipos.

1.  Añadir a `UMLStandardProfile`:
    - `@signal`: Extiende `UMLMetaclass.CLASS`.
    - `@receive`: Extiende `UMLMetaclass.OPERATION`. (Aunque se use en métodos, se tratará como recepción).
    - `@send`: Extiende `UMLMetaclass.USAGE`.
    - `@async`: Extiende `UMLMetaclass.OPERATION`.

### 🧠 Paso 3: Análisis Semántico y Validación

Modificar los analizadores para procesar el significado de los estereotipos.

1.  **StereotypeAnalyzer**:
    - Implementar reglas de validación "Core":
      - `signal` solo puede aplicarse a clases.
      - `receive` solo puede aplicarse a métodos de clase.
      - `send` solo puede aplicarse a relaciones de tipo dependencia/uso.
2.  **EntityAnalyzer (`processMembers`)**:
    - Al iterar sobre los métodos (`ASTNodeType.METHOD`):
      - Verificar si el nodo tiene el estereotipo `@receive`.
      - **Si lo tiene**: No añadirlo a `entity.operations`. En su lugar, crear un objeto `IRReception` y añadirlo a la nueva lista `entity.receptions`.
      - **Si no lo tiene**: Seguir el flujo normal hacia `operations`.
3.  **Inferencia de Tipos**:
    - Validar que el parámetro de un método marcado con `@receive` sea una clase marcada con `@signal`. (Opcional pero recomendado para robustez).

### 🎨 Paso 4: Actualización del Modelo del Renderer

Modificar los modelos internos del renderer para recibir la nueva información del IR.

1.  **UMLCompartmentNode**: (en `packages/renderer/src/core/model/shapes/compartment-node.abstract.ts`)
    - Añadir la propiedad `public receptions: UMLMember[] = []`.
    - Actualizar `getDimensions()` para incluir la altura del nuevo compartimento de recepciones.
2.  **ClassMapper**: (en `packages/renderer/src/core/model/factory/mappers/nodes/class-mapper.ts`)
    - Mapear la lista `receptions` desde el `IREntity` hacia el modelo del renderer.

### 🖌️ Paso 5: Dibujo y Visualización

Actualizar el renderizado visual en `packages/renderer/src/drawing/elements/class-node.ts`.

1.  **Clase Activa**: La lógica de `isActive` ya existe en el código, pero asegurar que el modificador `&` la active correctamente. Se debe dibujar la doble línea vertical en los laterales del rectángulo.
2.  **Compartimento de Recepciones**:
    - Si la entidad tiene elementos en `receptions`:
      - Dibujar una línea separadora (divider).
      - Dibujar la etiqueta opcional `«receptions»` o simplemente listar los miembros con el prefijo visual de señal (ej: `onSignal(p)`).
      - Asegurar que el layout reserve el espacio necesario.

---

## 🧪 Estrategia de Pruebas (TDD)

### 1. Motor (@umlts/engine)

- **Lexer/Parser**: Verificar que los estereotipos (`@signal`, `@receive`, `@send`) y el modificador (`&`) se capturen correctamente en el AST sin errores de sintaxis.
- **Semántica (StereotypeAnalyzer)**:
  - Test de error: Aplicar `@signal` a una relación.
  - Test de error: Aplicar `@receive` a un atributo.
  - Test de éxito: Validar compatibilidad básica.
- **Generación de IR (EntityAnalyzer)**:
  - Test: Una clase con `@receive onOrder()` debe tener `operations.length === 0` y `receptions.length === 1` en el IR generado.
  - Test: Una clase con `& class` debe tener `isActive: true` en el IR.

### 2. Renderer (@umlts/renderer)

- **Mapeo (ClassMapper)**: Verificar que los `IRReception` se transformen correctamente en `UMLMember` dentro de la lista de recepciones del modelo.
- **Visual (Snapshot Testing)**:
  - Verificar que se dibuje la doble línea vertical para clases activas.
  - Verificar la existencia de la línea divisoria y el texto de las recepciones en el SVG resultante.

---

## ✅ Checklist de Verificación

- [ ] ¿El motor detecta `& class` y marca `isActive: true` en el IR?
- [ ] ¿El motor mueve los métodos con `@receive` al campo `receptions` del IR?
- [ ] ¿El renderer dibuja un compartimento separado para las recepciones?
- [ ] ¿Las relaciones con `@send` muestran la etiqueta `«send»` y flecha abierta?
- [ ] ¿Los tests existentes siguen pasando?
