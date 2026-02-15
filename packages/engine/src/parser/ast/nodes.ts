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
}

export interface TypeNode extends ASTNode {
  type: ASTNodeType.TYPE
  kind: 'simple' | 'generic' | 'array' | 'enum'
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
  diagnostics?: Array<import('../diagnostic.types').Diagnostic>
}

export type StatementNode =
  | PackageNode
  | EntityNode
  | RelationshipNode
  | AssociationClassNode
  | CommentNode
  | ConfigNode

export interface PackageNode extends ASTNode {
  type: ASTNodeType.PACKAGE
  name: string
  body: StatementNode[]
}

export type EntityType = ASTNodeType.CLASS | ASTNodeType.INTERFACE | ASTNodeType.ENUM

export interface EntityNode extends ASTNode {
  type: EntityType
  name: string
  relationships: RelationshipHeaderNode[]
  body: MemberNode[] | undefined
  isAbstract: boolean
  isStatic: boolean
  isActive: boolean
  typeParameters?: string[] | undefined
}

export interface RelationshipHeaderNode extends ASTNode {
  type: ASTNodeType.RELATIONSHIP
  kind: string // >>, >I, >*, etc.
  target: string
  targetIsAbstract?: boolean
}

export type MemberNode = MethodNode | AttributeNode | CommentNode

export interface AttributeNode extends ASTNode {
  type: ASTNodeType.ATTRIBUTE
  name: string
  visibility: string
  isStatic: boolean
  typeAnnotation: TypeNode
  multiplicity: string | undefined
  relationshipKind?: string | undefined
  targetIsAbstract?: boolean
}

export interface MethodNode extends ASTNode {
  type: ASTNodeType.METHOD
  name: string
  visibility: string
  isStatic: boolean
  isAbstract: boolean
  parameters: ParameterNode[]
  returnType: TypeNode
  returnRelationshipKind?: string | undefined
  returnTargetIsAbstract?: boolean
}

export interface ParameterNode extends ASTNode {
  type: ASTNodeType.PARAMETER
  name: string
  typeAnnotation: TypeNode
  relationshipKind?: string | undefined
  targetIsAbstract?: boolean
  multiplicity?: string
}

export interface RelationshipNode extends ASTNode {
  type: ASTNodeType.RELATIONSHIP
  from: string
  fromIsAbstract: boolean
  fromMultiplicity: string | undefined
  to: string
  toIsAbstract: boolean
  toMultiplicity: string | undefined
  kind: string
  label: string | undefined
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
