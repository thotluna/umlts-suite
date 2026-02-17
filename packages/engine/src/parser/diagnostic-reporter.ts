import type { Diagnostic, DiagnosticCode } from '../syntax/diagnostic.types'
import { DiagnosticSeverity } from '../syntax/diagnostic.types'
import type { Token } from '../syntax/token.types'

/**
 * DiagnosticReporter: Gestiona el registro y la exposición de errores y warnings.
 */
export class DiagnosticReporter {
  private readonly diagnostics: Diagnostic[] = []

  public addError(message: string, token: Token, code?: DiagnosticCode): void {
    this.addDiagnostic(message, DiagnosticSeverity.ERROR, token, code)
  }

  public addWarning(message: string, token: Token, code?: DiagnosticCode): void {
    this.addDiagnostic(message, DiagnosticSeverity.WARNING, token, code)
  }

  public addInfo(message: string, token: Token, code?: DiagnosticCode): void {
    this.addDiagnostic(message, DiagnosticSeverity.INFO, token, code)
  }

  private addDiagnostic(
    message: string,
    severity: DiagnosticSeverity,
    token: Token,
    code?: DiagnosticCode,
  ): void {
    this.diagnostics.push({
      message,
      code,
      line: token.line,
      column: token.column,
      length: token.value.length || 1,
      severity,
    })
  }

  public getDiagnostics(): Diagnostic[] {
    return this.diagnostics
  }

  public hasErrors(): boolean {
    return this.diagnostics.some((d) => d.severity === DiagnosticSeverity.ERROR)
  }
}
