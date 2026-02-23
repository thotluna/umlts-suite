import type { Token } from '../syntax/token.types'
import type { TypeNode, StatementNode, MemberNode } from '../syntax/nodes'
import type { IREntity, IRRelationshipType } from '../generator/ir/models'
import type { IParserHub } from '../parser/core/parser.hub'
import type { Orchestrator } from '../parser/rule.types'

/**
 * Result of a type transformation by a plugin.
 */
export interface TypeMapping {
  targetName: string
  multiplicity?: string
  label?: string
  relationshipType?: IRRelationshipType
  isIgnored?: boolean
}

/**
 * Definition of a language-specific plugin for the UMLTS engine.
 */
export interface LanguagePlugin {
  /**
   * Technical name of the language (e.g., 'typescript', 'java').
   */
  readonly name: string

  /**
   * Returns a set of entities that form the "Standard Library" of the language.
   * These will be pre-registered in the SymbolTable.
   */
  getStandardLibrary(): IREntity[]

  /**
   * Resolves a technical type from the AST into a UML semantic mapping.
   * Useful for handling arrays, generics like Promise<T>, or Utility Types.
   */
  resolveType(node: TypeNode): TypeMapping | null

  /**
   * Maps a language primitive to a UML normative primitive name if applicable.
   * Example: 'number' -> 'Real', 'string' -> 'String'.
   */
  mapPrimitive(name: string): string | null

  /**
   * Hook for the Lexer: allows the plugin to match a token that the core engine doesn't recognize.
   * If the plugin returns a token, the Lexer will add it to the stream.
   */
  matchToken?(reader: ILexerReader): Token | null

  /**
   * Returns a list of language-specific statement rules.
   */
  getStatementRules?(): IPluginStatementRule[]

  /**
   * Returns a list of language-specific member providers.
   */
  getMemberRules?(): IPluginMemberProvider[]
}

/**
 * Interface for a plugin-specific statement rule.
 */
export interface IPluginStatementRule {
  canHandle(context: IParserHub): boolean
  parse(context: IParserHub, orchestrator: Orchestrator): StatementNode[] | null
}

/**
 * Interface for a plugin-specific member provider.
 */
export interface IPluginMemberProvider {
  canHandle(context: IParserHub): boolean
  parse(context: IParserHub, orchestrator: Orchestrator): MemberNode | null
}

/**
 * Interface-based LexerReader to avoid circular dependencies.
 */
export interface ILexerReader {
  peek(): string
  peekNext(): string
  advance(): string
  isAtEnd(): boolean
  getLine(): number
  getColumn(): number
  getPosition(): number
}
