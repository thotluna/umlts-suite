# 🧠 Implementación: Capa Semántica - Profiles & Stereotypes

Este documento detalla las reglas semánticas que deben cumplirse para garantizar la validez del modelo UMLTS con Perfiles y Estereotipos.

## 1. Reglas de Validación Semántica (Semantic Rules)

Se han definido las siguientes reglas que el `SemanticAnalyzer` deberá validar en el futuro:

### **R1: Regla de Extensión de Metaclase (Metaclass Compatibility)**

Un estereotipo **solo** puede aplicarse a elementos que coincidan con la metaclase que extiende.

- **Caso de Éxito**: `stereotype Entity >> class` -> `@Entity class User {}` ✅
- **Caso de Error**: `stereotype Entity >> class` -> `@Entity interface IRepo {}` ❌

### **R2: Regla de Unicidad de Definición (Uniqueness)**

No se permite definir dos estereotipos con el mismo nombre dentro de un perfil o perfiles importados.

- **Caso de Error**: `profile P1 { stereotype A } profile P2 { stereotype A }` ❌ (Conflicto de nombre en el mismo scope).

### **R3: Regla de Tipado de Tagged Values (Type Safety)**

Los valores asignados a las propiedades de un estereotipo deben coincidir con su tipo declarado. Se asume que los metadatos en el cuerpo se asocian al estereotipo.

- **Definición**: `stereotype async { timeout: Number }`
- **Caso de Éxito**: `@async class X { [timeout=100] }` ✅
- **Caso de Error**: `@async class X { [timeout="fast"] }` ❌ (Se esperaba un número).

### **R4: Regla de Aplicación Única (Cardinality)**

Un mismo estereotipo no puede aplicarse más de una vez al mismo elemento (a menos que se especifique soporte para multi-aplicación en la definición, lo cual no es estándar UML 2.5 por defecto).

- **Caso de Error**: `@Entity @Entity class User` ❌

### **R5: Regla de Resolución de Perfil (Profile Scope)**

Los estereotipos solo pueden utilizarse si su perfil ha sido previamente definido o importado en el workspace. El motor de resolución debe ser capaz de buscar definiciones de estereotipos transversalmente a los archivos.

## 2. Inferencia y Atajos (DSL Magic)

Para mantener la simplicidad del DSL, se proponen los siguientes comportamientos de inferencia:

- **Estereotipos Implícitos**: Si se usa un estereotipo `@Name` que no existe en ningún perfil, el motor puede inferir una extensión genérica a `Element` para facilitar el prototipado rápido, emitiendo un _Warning_ en lugar de un _Error_.
- **Tagged Values como Metadata**: Los tags definidos en el cuerpo `[ key=value ]` se consideran metadatos que mapean a los mismos tagged values del estereotipo, unificando la sintaxis in-line y la sintaxis de bloque.

## 3. Implementación Realizada

Se ha implementado la infraestructura semántica para perfiles y estereotipos:

### **A. StereotypeAnalyzer**

Un nuevo analizador especializado (`packages/engine/src/semantics/analyzers/stereotype-analyzer.ts`) que se encarga de:

- **Resolución**: Busca la definición del estereotipo en el `ProfileRegistry`.
- **Validación de Metaclase**: Comprueba si el elemento destino (Class, Interface, etc.) es compatible con lo que el estereotipo declara extender (usando una jerarquía básica: `Class extends Classifier`, etc.).
- **Validación de Tagged Values**: Verifica que los tipos de los valores (`String`, `Integer`, `Float`, `Boolean`) coincidan con la definición.

### **B. Integración en el Pipeline**

- **DiscoveryPass**: Ahora registra los `ProfileNode` y sus `StereotypeNode` en el `ProfileRegistry` global.
- **EntityAnalyzer & RelationshipAnalyzer**: Inyectan el `StereotypeAnalyzer` para procesar los estereotipos de clases, interfaces, enums y relaciones durante la fase de análisis.

### **C. Representación en IR**

- Las entidades (`IREntity`) y relaciones (`IRRelationship`) ahora incluyen una propiedad `stereotypes: string[]` que contiene los nombres de los estereotipos validados, listos para que el renderer los muestre.

## 4. Próximos Pasos de Acción

1.  **Rendering**: Actualizar los renderers de SVG para mostrar `«Stereotype»` sobre el nombre de la entidad.
2.  **Referenciación Cruzada**: Mejorar el motor para cargar perfiles desde archivos externos (Workspace indexing).
