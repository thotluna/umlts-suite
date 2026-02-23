import { ParserContext } from '@engine/parser/parser.context'
import { DiagnosticReporter } from '@engine/parser/diagnostic-reporter'
import type { CompilerContext } from '@engine/compiler/phases/context'
import type { PipelineArtifacts } from '@engine/compiler/phases/pipeline-artifacts'
import type { CompilerPhase } from '@engine/compiler/phases/types'
import { SemanticAnalyzer } from '@engine/semantics/analyzer'
import type { PluginManager } from '@engine/plugins/plugin-manager'
import { MemberRegistry } from '@engine/parser/rules/member-strategies/member.registry'
import { TypeRegistry } from '@engine/parser/rules/type-strategies/type.registry'
import { PluginMemberProvider } from '@engine/parser/rules/plugin-member.provider'

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
