import type { TokenType, Token } from '@engine/syntax/token.types'
import type { Diagnostic, DiagnosticCode } from '@engine/syntax/diagnostic.types'

import type { IMemberProvider } from '@engine/parser/core/member-provider.interface'
import type {
  IPrimaryTypeProvider,
  ITypeModifierProvider,
} from '@engine/parser/core/type-provider.interface'

/**
 * IParserHub: Facade interface exposing parser services to rules.
 * Defines the contract for token navigation, error reporting, and documentation management.
 */
export interface IParserHub {
  // Navigation
  peek(): Token
  lookahead(n?: number): Token
  prev(): Token
  advance(): Token
  getPosition(): number
  rollback(position: number): void
  isAtEnd(): boolean
  check(type: TokenType): boolean
  checkAny(...types: TokenType[]): boolean

  // Coordination Logic
  match(...types: TokenType[]): boolean
  consume(type: TokenType, message: string): Token
  softConsume(type: TokenType, message: string): Token
  sync(isPointOfNoReturn: () => boolean): void

  // Session Management
  /**
   * Clears the volatile state of the current session (e.g., pending docs).
   */
  clearSession(): void

  // Diagnostics
  addError(message: string, token?: Token, code?: DiagnosticCode): void
  addWarning(message: string, token?: Token, code?: DiagnosticCode): void
  addInfo(message: string, token?: Token, code?: DiagnosticCode): void
  getDiagnostics(): Diagnostic[]
  hasErrors(): boolean

  // Documentation
  setPendingDocs(docs: string): void
  consumePendingDocs(): string | undefined

  // Registry Services
  /**
   * Returns the list of registered member providers.
   */
  getMemberProviders(): IMemberProvider[]

  /**
   * Returns the list of registered primary type providers.
   */
  getTypePrimaries(): IPrimaryTypeProvider[]

  /**
   * Returns the list of registered type modifiers.
   */
  getTypeModifiers(): ITypeModifierProvider[]
}
