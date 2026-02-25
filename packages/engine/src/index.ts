// Main API exports
export type { ParseResult } from '@engine/generator/types'

// IR (Intermediate Representation) model exports
export { IREntityType, IRRelationshipType, IRVisibility } from '@engine/generator/ir/models'

export type {
  IRDiagram,
  IREntity,
  IRRelationship,
  IRProperty,
  IROperation,
  IRParameter,
  IRConstraint,
  IRMultiplicity,
} from '@engine/generator/ir/models'

// Diagnostics exports
export type { Diagnostic, DiagnosticSeverity } from '@engine/syntax/diagnostic.types'

export * from '@engine/UMLEngine'

// Plugin System exports
export * from './plugin/plugin.types'
export * from './plugin/language.types'

// Lexer & Parser Infra for Plugins
export type { TokenMatcher } from '@engine/lexer/matcher.types'
export { LexerReader } from '@engine/lexer/lexer.reader'
export { TokenType } from '@engine/syntax/token.types'
export type { Token } from '@engine/syntax/token.types'

// AST and Parser types for Plugins
export { ASTNodeType } from '@engine/syntax/nodes'
export { ASTFactory } from '@engine/parser/factory/ast.factory'
export type {
  ASTNode,
  ProgramNode,
  StatementNode,
  PackageNode,
  EntityNode,
  RelationshipNode,
  AssociationClassNode,
  CommentNode,
  ConfigNode,
  ConstraintNode,
  NoteNode,
  AnchorNode,
  Modifiers,
  TypeNode,
  MemberNode,
  AttributeNode,
  MethodNode,
  ParameterNode,
  RelationshipHeaderNode,
} from '@engine/syntax/nodes'
export type { IParserHub } from '@engine/parser/core/parser.hub'
export type { StatementRule, Orchestrator } from '@engine/parser/rule.types'
export { MemberRule } from '@engine/parser/rules/member.rule'
