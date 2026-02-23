import type { TokenType, Token } from '@engine/syntax/token.types'
import type { Diagnostic, DiagnosticCode } from '@engine/syntax/diagnostic.types'

import type { IMemberProvider } from '@engine/parser/core/member-provider.interface'
import type {
  IPrimaryTypeProvider,
  ITypeModifierProvider,
} from '@engine/parser/core/type-provider.interface'

/**
 * IParserHub: Interfaz de fachada que expone los servicios del parser a las reglas.
 * Define el contrato para la navegación de tokens, reporte de errores y gestión de documentación.
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

  // Registry Services
  /**
   * Obtiene la lista de proveedores de miembros registrados.
   */
  getMemberProviders(): IMemberProvider[]

  /**
   * Obtiene la lista de proveedores primarios de tipos.
   */
  getTypePrimaries(): IPrimaryTypeProvider[]

  /**
   * Obtiene la lista de modificadores de tipos registrados.
   */
  getTypeModifiers(): ITypeModifierProvider[]
}
