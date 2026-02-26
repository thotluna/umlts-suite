import type { Diagnostic } from '@engine/syntax/diagnostic.types'

export enum ASTNodeType {
  PROGRAM = 'Program',
  PACKAGE = 'Package',
  CLASS = 'Class',
  INTERFACE = 'Interface',
  ENUM = 'Enum',
  METHOD = 'Method',
  ATTRIBUTE = 'Attribute',
  PARAMETER = 'Parameter',
  RELATIONSHIP = 'Relationship',
  COMMENT = 'Comment',
  TYPE = 'Type',
  CONFIG = 'Config',
  ASSOCIATION_CLASS = 'AssociationClass',
  CONSTRAINT = 'Constraint',
  NOTE = 'Note',
  ANCHOR = 'Anchor',
}

export interface TypeNode extends ASTNode {
  type: ASTNodeType.TYPE
  kind: 'simple' | 'generic' | 'array' | 'enum' | 'xor'
  raw: string
  name: string
  arguments?: TypeNode[]
  values?: string[]
}

export interface ASTNode {
  type: ASTNodeType
  line: number
  column: number
  docs?: string | undefined
}

export interface ProgramNode extends ASTNode {
  type: ASTNodeType.PROGRAM
  body: StatementNode[]
  diagnostics?: Diagnostic[]
}

export type StatementNode =
  | PackageNode
  | EntityNode
  | RelationshipNode
  | AssociationClassNode
  | CommentNode
  | ConfigNode
  | ConstraintNode
  | NoteNode
  | AnchorNode

export interface NoteNode extends ASTNode {
  type: ASTNodeType.NOTE
  value: string
  id?: string
}

export interface AnchorNode extends ASTNode {
  type: ASTNodeType.ANCHOR
  from: string
  to: string[]
}

export interface PackageNode extends ASTNode {
  type: ASTNodeType.PACKAGE
  name: string
  body: StatementNode[]
}

export type EntityType = ASTNodeType.CLASS | ASTNodeType.INTERFACE | ASTNodeType.ENUM

export interface Modifiers {
  isAbstract?: boolean
  isStatic?: boolean
  isActive?: boolean
  isLeaf?: boolean
  isFinal?: boolean
  isRoot?: boolean
}

export interface EntityNode extends ASTNode {
  type: EntityType
  name: string
  relationships: RelationshipHeaderNode[]
  body: MemberNode[] | undefined
  modifiers: Modifiers
  typeParameters?: string[] | undefined
}

export interface RelationshipHeaderNode extends ASTNode {
  type: ASTNodeType.RELATIONSHIP
  kind: string // >>, >I, >*, etc.
  target: string
  isNavigable: boolean
  targetModifiers?: Modifiers
}

export type MemberNode = MethodNode | AttributeNode | CommentNode | ConstraintNode | NoteNode

export interface AttributeNode extends ASTNode {
  type: ASTNodeType.ATTRIBUTE
  name: string
  visibility: string
  modifiers: Modifiers
  typeAnnotation: TypeNode
  multiplicity: string | undefined
  relationshipKind?: string | undefined
  isNavigable?: boolean
  label?: string | undefined
  constraints?: ConstraintNode[]
  notes?: NoteNode[]
  targetModifiers?: Modifiers
}

export interface MethodNode extends ASTNode {
  type: ASTNodeType.METHOD
  name: string
  visibility: string
  modifiers: Modifiers
  parameters: ParameterNode[]
  returnType: TypeNode
  returnMultiplicity?: string
  returnRelationshipKind?: string | undefined
  isNavigable?: boolean
  constraints?: ConstraintNode[]
  notes?: NoteNode[]
  returnTargetModifiers?: Modifiers
}

export interface ParameterNode extends ASTNode {
  type: ASTNodeType.PARAMETER
  name: string
  typeAnnotation: TypeNode
  relationshipKind?: string | undefined
  isNavigable?: boolean
  constraints?: ConstraintNode[]
  notes?: NoteNode[]
  targetModifiers?: Modifiers

  multiplicity?: string
}

export interface RelationshipNode extends ASTNode {
  type: ASTNodeType.RELATIONSHIP
  from: string
  fromModifiers?: Modifiers
  fromMultiplicity: string | undefined
  to: string
  toModifiers?: Modifiers
  toMultiplicity: string | undefined
  kind: string
  isNavigable: boolean
  label: string | undefined
  constraints?: ConstraintNode[]
  body?: MemberNode[]
}

export interface AssociationClassNode extends ASTNode {
  type: ASTNodeType.ASSOCIATION_CLASS
  name: string
  participants: {
    name: string
    multiplicity?: string
    relationships?: RelationshipHeaderNode[]
  }[]
  body: MemberNode[] | undefined
}

export interface CommentNode extends ASTNode {
  type: ASTNodeType.COMMENT
  value: string
}

export interface ConfigNode extends ASTNode {
  type: ASTNodeType.CONFIG
  options: Record<string, unknown>
}

export interface ConstraintNode extends ASTNode {
  type: ASTNodeType.CONSTRAINT
  kind: string // 'xor', 'ordered', 'unique', etc.
  targets?: string[] // For global constraints
  body?: StatementNode[] // For block xor { ... }
  expression?: string // Raw text inside { ... }
}
