import type { Diagnostic } from '../syntax/diagnostic.types'
import { DiagnosticSeverity } from '../syntax/diagnostic.types'
import type { Token } from '../syntax/token.types'
import type { ProgramNode } from '../syntax/nodes'
import type { IRDiagram } from '../generator/ir/models'
import type { LanguagePlugin } from '../plugins/language-plugin'
import { SemanticAnalyzer } from '../semantics/analyzer'

export class CompilerContext {
  public tokens: Token[] = []
  public ast: ProgramNode | null = null
  public diagram: IRDiagram | null = null
  public readonly diagnostics: Diagnostic[] = []
  public readonly analyzer: SemanticAnalyzer
  public activePlugin?: LanguagePlugin

  constructor(public readonly source: string) {
    this.analyzer = new SemanticAnalyzer()
    this.activePlugin = this.analyzer.getPluginManager().getActive()
  }

  public addDiagnostics(items: Diagnostic[]): void {
    this.diagnostics.push(...items)
  }

  public hasErrors(): boolean {
    return this.diagnostics.some((d) => d.severity === DiagnosticSeverity.ERROR)
  }
}
