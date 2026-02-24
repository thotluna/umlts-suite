import type { Diagnostic } from '@engine/syntax/diagnostic.types'
import { DiagnosticSeverity } from '@engine/syntax/diagnostic.types'
export class CompilerContext {
  public readonly diagnostics: Diagnostic[] = []

  constructor(public readonly source: string) {}

  public addDiagnostics(items: Diagnostic[]): void {
    this.diagnostics.push(...items)
  }

  public hasErrors(): boolean {
    return this.diagnostics.some((d) => d.severity === DiagnosticSeverity.ERROR)
  }
}
