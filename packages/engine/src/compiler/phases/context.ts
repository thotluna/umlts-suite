import type { Diagnostic, DiagnosticCode } from '@engine/syntax/diagnostic.types'
import { DiagnosticSeverity } from '@engine/syntax/diagnostic.types'
import type { Token } from '@engine/syntax/token.types'
import type { PluginRegistry } from '@engine/plugin/plugin.registry'
import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'
import { DiagnosticReporter } from '@engine/core/diagnostics/diagnostic-reporter'

export class CompilerContext implements ISemanticContext {
  private readonly reporter = new DiagnosticReporter()

  constructor(
    public readonly source: string,
    public readonly registry: PluginRegistry,
  ) {}

  public addDiagnostics(items: Diagnostic[]): void {
    items.forEach((d) => {
      if (d.severity === DiagnosticSeverity.ERROR)
        this.addError(d.message, { line: d.line, column: d.column } as Token)
      else if (d.severity === DiagnosticSeverity.WARNING)
        this.addWarning(d.message, { line: d.line, column: d.column } as Token)
      else this.addInfo(d.message, { line: d.line, column: d.column } as Token)
    })
  }

  public addError(message: string, token?: Token, code?: DiagnosticCode): void {
    this.reporter.addError(message, token, code)
  }

  public addWarning(message: string, token?: Token, code?: DiagnosticCode): void {
    this.reporter.addWarning(message, token, code)
  }

  public addInfo(message: string, token?: Token, code?: DiagnosticCode): void {
    this.reporter.addInfo(message, token, code)
  }

  public getDiagnostics(): Diagnostic[] {
    return this.reporter.getDiagnostics()
  }

  public hasErrors(): boolean {
    return this.reporter.hasErrors()
  }
}
