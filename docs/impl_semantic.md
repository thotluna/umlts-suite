# 🧠 Implementación: Capa Semántica (Analyzer)

Este documento detalla la lógica de validación semántica (Reglas de Negocio) para garantizar el cumplimiento de UML 2.5.1.

## 1. El Registro de Perfiles (`packages/engine/src/semantics/profiles/profile.registry.ts`)

Añadir y robustecer el registro central:

```typescript
export class ProfileRegistry {
  // ... existentes
  public validate(stereotypeName: string, metaclass: UMLMetaclass): boolean {
    const st = this.getStereotype(stereotypeName)
    if (!st) return false // Inferencia: Warning, no error fatal
    return st.extends.includes(metaclass)
  }
}
```

## 2. El Pipeline de Validación (`packages/engine/src/semantics/validators/stereotype.validator.ts`)

Definir las 5 reglas semánticas como validadores del motor (`SemanticRule.ts`):

### **Regla 1: Unicidad (UnicityRule)**

```typescript
const duplicates = node.stereotypes.filter((s, i) => node.stereotypes.indexOf(s) !== i)
if (duplicates.length > 0) {
  this.addError(`Estereotipo duplicado: @${duplicates[0]}`, node)
}
```

### **Regla 2: Extensión (ExtensionRule)**

```typescript
const isValid = registry.validate(stereotypeName, node.metaclass)
if (!isValid) {
  this.addError(`El estereotipo @${name} no es aplicable a ${node.metaclass}`, node)
}
```

### **Regla 3: Esquema de Datos (PropertyRule)**

```typescript
const properties = node.taggedValues.keys()
for (const prop of properties) {
  if (!definition.properties[prop]) {
    this.addError(`La propiedad '${prop}' no existe en el estereotipo @${name}`, node)
  }
}
```

## 3. Guía de Acción Semántica

1.  **Pase de Descubrimiento (Pass 1)**: Identificar todos los bloques `profile` y registrarlos en el `ProfileRegistry`.
2.  **Pase de Resolución (Pass 2)**: Vincular cada `@estereotipo` con su definición en el registro.
3.  **Pase de Validación (Pass 3)**: Ejecutar los validadores de unicidad, extensión y esquema de datos.
4.  **Inferencia Controlada**: Si un estereotipo no existe, registrar el Warning pero permitir que el objeto se marque con la metaclase base inferida por el Parser.
