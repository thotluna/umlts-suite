import type { TokenType, Token } from '../../syntax/token.types'
import type { Diagnostic, DiagnosticCode } from '../../syntax/diagnostic.types'

/**
 * IParserHub: Interfaz de fachada que expone los servicios del parser a las reglas.
 * Define el contrato para la navegación de tokens, reporte de errores y gestión de documentación.
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

  // Session Management
  /**
   * Limpia el estado volátil de la sesión actual (ej. docs pendientes).
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
}
