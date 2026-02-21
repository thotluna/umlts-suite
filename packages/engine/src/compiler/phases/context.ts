import type { Diagnostic } from '../../syntax/diagnostic.types'
import { DiagnosticSeverity } from '../../syntax/diagnostic.types'
import type { LanguagePlugin } from '../../plugins/language-plugin'

export class CompilerContext {
  public readonly diagnostics: Diagnostic[] = []

  constructor(
    public readonly source: string,
    public readonly plugin?: LanguagePlugin,
  ) {}

  public addDiagnostics(items: Diagnostic[]): void {
    this.diagnostics.push(...items)
  }

  public hasErrors(): boolean {
    return this.diagnostics.some((d) => d.severity === DiagnosticSeverity.ERROR)
  }
}
