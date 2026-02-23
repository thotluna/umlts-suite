import type { Diagnostic, DiagnosticCode } from '@engine/syntax/diagnostic.types'
import type { Token } from '@engine/syntax/token.types'

/**
 * Abstracts the environment needed for semantic analysis,
 * breaking tight coupling with Parser components while providing
 * necessary utilities (like diagnostics reporting).
 */
export interface ISemanticContext {
  addError(message: string, token?: Token, code?: DiagnosticCode): void
  addWarning(message: string, token?: Token, code?: DiagnosticCode): void
  addInfo(message: string, token?: Token, code?: DiagnosticCode): void
  getDiagnostics(): Diagnostic[]
  hasErrors(): boolean
}
