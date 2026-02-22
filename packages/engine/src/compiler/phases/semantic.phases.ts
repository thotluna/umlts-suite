import { ParserContext } from '../../parser/parser.context'
import { DiagnosticReporter } from '../../parser/diagnostic-reporter'
import type { CompilerContext } from './context'
import type { PipelineArtifacts } from './pipeline-artifacts'
import type { CompilerPhase } from './types'
import { SemanticAnalyzer } from '../../semantics/analyzer'
import type { PluginManager } from '../../plugins/plugin-manager'
import { MemberRegistry } from '../../parser/rules/member-strategies/member.registry'
import { TypeRegistry } from '../../parser/rules/type-strategies/type.registry'
import { PluginMemberProvider } from '../../parser/rules/plugin-member.provider'

export class SemanticPhase implements CompilerPhase {
  private readonly analyzer: SemanticAnalyzer

  constructor(pluginManager: PluginManager) {
    this.analyzer = new SemanticAnalyzer(pluginManager)
  }

  public run(context: CompilerContext, artifacts: PipelineArtifacts): void {
    if (!artifacts.ast) return
    const reporter = new DiagnosticReporter()

    const members = new MemberRegistry()
    const types = new TypeRegistry()
    if (context.plugin) {
      members.registerProvider(new PluginMemberProvider(context.plugin))
    }

    const parserContext = new ParserContext(artifacts.tokens, reporter, members, types)
    artifacts.diagram = this.analyzer.analyze(artifacts.ast, parserContext)
    context.addDiagnostics(reporter.getDiagnostics())
  }
}
