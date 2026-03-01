# 🏛️ Perfiles y Estereotipos UML: Registro de Desarrollo

## 🎯 Objetivo de Alto Nivel

Establecer un mecanismo robusto y ágil para el uso de Perfiles y Estereotipos en UMLTS, asegurando el cumplimiento con las extensiones del metamodelo de UML 2.5.1 y manteniendo una experiencia de desarrollo (DX) superior.

---

## 📌 Decisiones Clave y Conceptos Core

### 1. Perfil Estándar Integrado (Built-in)

- **Decisión**: Al igual que StarUML, UMLTS incluirá de serie un `UMLStandardProfile`.
- **Razón**: Evita el problema del "arranque en frío". El usuario puede usar `@entity`, `@control` o `@service` inmediatamente sin configurar nada.
- **Alcance**: Incluye estereotipos comunes para Clases (`entity`, `control`, `boundary`), Componentes (`service`, `process`) y Abstracciones (`derive`, `refine`, `trace`).

### 6. Ubicación y Orden de Declaración

- **Regla de Oro**: Los bloques `profile` deben residir al inicio del archivo (después de `config`) o antes de la primera declaración de entidad.
- **Razón**: Garantiza que el esquema de extensiones esté disponible para el motor antes de procesar el modelo, evitando re-validaciones costosas.

### 7. Inferencia de Estereotipos (Inferencia vs Rigor)

- **Concepto**: Se permite usar estereotipos no definidos (ej. `@tag`) para no bloquear el flujo de bocetado.
- **Mecanismo**: El motor infiere la Metaclase base del elemento al que se aplica (ej. si se aplica a una clase, se asume `extends Class`).
- **Limitación**: Los estereotipos inferidos se consideran "Volátiles" y generarán un **Warning de Validación**. Además, **no soportan Tagged Values** hasta que se definan formalmente en un perfil.

---

## 🛡️ Reglas Semánticas Innegociables (UML 2.5.1)

1. **Aplicación Unívoca**: Prohibido aplicar el mismo estereotipo dos veces sobre el mismo elemento.
2. **Validación de Metaclase**: Un estereotipo solo puede aplicarse a la Metaclase que extiende (ej. `@service` en `Component`).
3. **Integridad de Metadatos**: Los valores en `[ ]` deben coincidir con las propiedades definidas en el perfil.
4. **Herencia de Estereotipos**: Soporte para jerarquías (ej. `Document` extiende `File`), heredando propiedades y anclas.
5. **Resolución de Ámbito**: Todo estereotipo debe ser resoluble vía `UMLStandardProfile`, perfiles locales definidos o importados.

### 2. Sintaxis del DSL: Aplicación y Metadatos

- **Anotación de Estereotipo**: Se utiliza el prefijo `@` para aplicar un estereotipo (ej. `@entity class User`). Es unívoco y rápido de escribir.
- **Segmento de Tagged Values (Metadatos)**: Los valores de las propiedades del estereotipo se declaran en un nuevo compartimento dentro de la entidad usando corchetes `[ ]`.
  - _Ejemplo_: `[ table = "users", cache = true ]`.
- **Relaciones con Estereotipos**: Se permite aplicar estereotipos directamente en la línea de relación para extender su semántica.
  - _Ejemplo_: `User @trace >> BaseUser`.

### 3. El Bloque `profile` (Definición de Perfiles)

- **Namespace**: El bloque `profile Nombre { ... }` actúa como un espacio de nombres para evitar colisiones. Permite desambiguar si existen estereotipos iguales en perfiles diferentes (`@Java::service` vs `@UML::service`).
- **Vínculo con Metaclases**: Todo estereotipo debe declarar obligatoriamente qué Metaclase UML extiende mediante el operador `>>` (ej. `stereotype table >> class`).

---

## 🛠️ Arquitectura del Motor (El Andamiaje)

1. **Mapeo de Metaclases**: El motor mapea internamente cada nodo del AST a su metaclase UML correspondiente (`UML::Class`, `UML::Property`, `UML::Generalization`, etc.). Esto es el origen de toda la semántica.
2. **Registro de Perfiles (Registry)**: Un servicio central que gestiona los perfiles activos y valida las definiciones de los estereotipos.
3. **Validación Semántica Estricta**:
   - **Compatibilidad**: El motor verifica que el estereotipo `@service` solo se aplique a nodos cuya metaclase sea compatible (ej. `Component` o `Class`).
   - **Esquema de Datos**: Valida que los _Tagged Values_ usados en un bloque `[ ]` existan y tengan el tipo correcto según la definición del perfil.
4. **Extensión de la Representación Intermedia (IR)**: La IR transportará estas aplicaciones de estereotipos y sus metadatos al Renderer para su visualización.

---

## 🚀 Plan de Implementación (V4)

1. **Fase 1: Cimiento del Metamodelo**: (Completado) Definición de `UMLMetaclass` y anclaje en los nodos del AST.
2. **Fase 2: Infraestructura de Perfiles**: (Completado) Implementación del `ProfileRegistry` y carga del Perfil Estándar.
3. **Fase 3: Gramática y Parser**: (Completado) Implementación de `ProfileRule`, `StereotypeRule`, `StereotypeApplicationRule` y soporte en entidades. Ver [impl_lexical.md](./impl_lexical.md) e [impl_syntax.md](./impl_syntax.md).
4. **Fase 4: Semántica y Metadata**: (En curso) Definición de reglas de validación y chequeo de tipos para Tagged Values. Ver [impl_semantic.md](./impl_semantic.md).
5. **Fase 5: Renderizado**: (Pendiente) Visualización de `«estereotipo»` y el compartimento de metadatos `{key=value}` en el diagrama SVG.
