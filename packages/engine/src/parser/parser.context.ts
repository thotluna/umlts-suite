import type { Token, TokenType } from '../syntax/token.types'
import type { DiagnosticCode } from '../syntax/diagnostic.types'

/**
 * Contracts for the Parsing Environment.
 * This interface decouples the rules and plugins from the specific Hub implementation.
 */

export interface IParserHub {
  // Navigation
  peek(): Token
  peekNext(): Token
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

  // Diagnostics
  addError(message: string, token?: Token, code?: DiagnosticCode): void
  addWarning(message: string, token?: Token, code?: DiagnosticCode): void
  addInfo(message: string, token?: Token, code?: DiagnosticCode): void

  // Documentation
  setPendingDocs(docs: string): void
  consumePendingDocs(): string | undefined
}
