# 🏗️ Implementación: Capa Sintáctica (Parser)

Este documento detalla la estructura del AST y las reglas del Parser para Perfiles, Estereotipos y Tagged Values.

## 1. Nodos del AST (`packages/engine/src/syntax/nodes.ts`)

Definir las interfaces para representar las nuevas estructuras en el árbol sintáctico:

```typescript
export enum ASTNodeType {
  // ... existentes
  PROFILE = 'PROFILE',
  STEREOTYPE_DEFINITION = 'STEREOTYPE_DEFINITION',
  TAGGED_VALUE_SEGMENT = 'TAGGED_VALUE_SEGMENT',
  TAG_PROPERTY = 'TAG_PROPERTY',
}

/** Bloque profile { ... } */
export interface ProfileNode extends ProgramItemNode {
  type: ASTNodeType.PROFILE
  name: string
  stereotypes: StereotypeDefinitionNode[]
}

/** Declaración stereotype Nombre extends Metaclase { ... } */
export interface StereotypeDefinitionNode extends ASTNode {
  type: ASTNodeType.STEREOTYPE_DEFINITION
  name: string
  extends: string // ID de la metaclase (Class, Interface, etc)
  properties: TagPropertyNode[]
}

/** Segmento de metadatos dentro de una entidad: [ table="users" ] */
export interface TaggedValueSegmentNode extends ASTNode {
  type: ASTNodeType.TAGGED_VALUE_SEGMENT
  values: Record<string, any> // [ key = value ]
}
```

## 2. Definición de Gramática (Parser Rules)

Crear y registrar las nuevas reglas en `packages/engine/src/parser/rules/*`:

### **ProfileRule.ts**

```typescript
// Gramática: profile <ID> { <StereotypeRule>* }
const profileName = this.consume(TokenType.IDENTIFIER)
this.consume(TokenType.LBRACE)
const stereotypes = this.parseMany(this.stereotypeRule)
this.consume(TokenType.RBRACE)
```

### **StereotypeDefinitionRule.ts**

```typescript
// Gramática: stereotype <ID> extends <Metaclass> { <Prop>* }
const name = this.consume(TokenType.IDENTIFIER)
this.consume(TokenType.EXTENDS)
const metaclass = this.consume(TokenType.IDENTIFIER) // ej: Class
// ... parseo de propiedades de metadatos
```

### **StereotypeApplicationRule.ts**

```typescript
// Gramática: @<ID> [ <Entity> | <Relationship> ]
this.consume(TokenType.AT)
const name = this.consume(TokenType.IDENTIFIER)
// Este "Name" se inyecta en el campo stereotypes[] del siguiente nodo
```

## 3. Integración en `ASTFactory`

Asegurar que el Factory soporte la creación de estos nuevos tipos mediante métodos como `createProfile` y `createStereotypeDefinition`.
