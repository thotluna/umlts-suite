# 🏗️ Implementación: Capa Sintáctica (Parser) - Profiles & Stereotypes

Este documento detalla la estructura del AST y las reglas del Parser para Perfiles, Estereotipos y Metadatos.

## 1. Nodos del AST (`packages/engine/src/syntax/nodes.ts`)

Definir las interfaces para representar las nuevas estructuras en el árbol sintáctico:

```typescript
export enum ASTNodeType {
  // ... existentes
  PROFILE = 'Profile',
  STEREOTYPE = 'Stereotype',
  TAGGED_VALUE_DEFINITION = 'TaggedValueDefinition',
  STEREOTYPE_APPLICATION = 'StereotypeApplication',
  METADATA = 'Metadata', // [ table="users" ]
}

/** Perfil que agrupa definiciones de estereotipos */
export interface ProfileNode extends BaseNode {
  type: ASTNodeType.PROFILE
  name: string
  stereotypes: StereotypeNode[]
}

/** Definición de un estereotipo dentro de un perfil */
export interface StereotypeNode extends ASTNode {
  type: ASTNodeType.STEREOTYPE
  name: string
  extends: UMLMetaclass[]
  properties: TaggedValueDefinitionNode[]
}

/** Aplicación de un estereotipo: @entity o @async */
export interface StereotypeApplicationNode extends ASTNode {
  type: ASTNodeType.STEREOTYPE_APPLICATION
  name: string
}

/** Segmento de metadatos genérico en cuerpo de entidad: [ key=value ] */
export interface MetadataNode extends MemberNode {
  type: ASTNodeType.METADATA
  values: Record<string, string | number | boolean>
}
```

## 2. Definición de Gramática (Parser Rules)

### **ProfileRule.ts**

```typescript
// Gramática: profile <ID> { <StereotypeRule>* }
const startToken = context.consume(TokenType.KW_PROFILE)
const name = context.softConsume(TokenType.IDENTIFIER).value
// Parseo de cuerpo con llaves opcionales
```

### **StereotypeRule.ts**

```typescript
// Gramática: stereotype <ID> extends <Metaclass|Keyword> { <Prop>* }
// Soporta: stereotype Entity extends class, stereotype Service extends interface
```

### **StereotypeApplicationRule.ts**

```typescript
// Gramática: @<ID>
// Este componente se inyecta en ClassRule, InterfaceRule, RelationshipRule, etc.
```

### **Manejo de Prefijos (`skipPrefixes`)**

Para permitir que el `Parser` identifique una entidad precedida por estereotipos (ej: `@Entity class User`), se implementó una técnica de _lookahead_ dinámico en `StereotypeApplicationRule.skipPrefixes`.

```typescript
public static skipPrefixes(context: IParserHub): number {
  let offset = 0;
  // Salta todos los @Name secuenciales
  return offset;
}
```

## 3. Resolución de Colisiones: Config vs Stereotypes

Se ha actualizado el `ConfigRule` para que NO capture estereotipos. Ahora solo maneja `@` si va seguido de `IDENTIFIER` y `COLON` (`@key: value`), dejando el resto para la lógica de estereotipos.

## 4. Integración en `ASTFactory`

El factor encargado de centralizar la creación de nodos se actualizó para soportar todas las nuevas estructuras, garantizando que el `metaclass` de UML se asigne correctamente según el tipo de nodo.
