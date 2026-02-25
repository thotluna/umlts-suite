import type { Diagnostic, DiagnosticCode } from '@engine/syntax/diagnostic.types'
import type { Token } from '@engine/syntax/token.types'
import type { PluginRegistry } from '@engine/plugin/plugin.registry'

/**
 * Abstracts the environment needed for semantic analysis,
 * breaking tight coupling with Parser components while providing
 * necessary utilities (like diagnostics reporting).
 */
export interface ISemanticContext {
  readonly registry?: PluginRegistry // Optional to maintain compatibility with simple tests
  addError(message: string, token?: Token, code?: DiagnosticCode): void
  addWarning(message: string, token?: Token, code?: DiagnosticCode): void
  addInfo(message: string, token?: Token, code?: DiagnosticCode): void
  getDiagnostics(): Diagnostic[]
  hasErrors(): boolean
}
