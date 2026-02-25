import { CompilerContext } from '@engine/compiler/phases/context'
import { PhasesFactory } from '@engine/compiler/phases/phases.factory'
import { PipelineArtifacts } from '@engine/compiler/phases/pipeline-artifacts'
import { ParseResult } from '@engine/generator/types'
import { IUMLPlugin } from './plugin/plugin.types'
import { PluginRegistry } from './plugin/plugin.registry'

export class UMLEngine {
  private readonly factory = new PhasesFactory()
  private readonly phases = this.factory.getPhases()
  private readonly registry: PluginRegistry

  constructor(plugins: IUMLPlugin[] = []) {
    this.registry = new PluginRegistry(plugins)
  }

  public parse(source: string): ParseResult {
    const context = new CompilerContext(source, this.registry)
    const artifacts = new PipelineArtifacts()

    for (const phase of this.phases) {
      phase.run(context, artifacts)
      if (context.hasErrors()) break
    }

    return {
      diagram: artifacts.diagram!,
      diagnostics: context.getDiagnostics(),
      isValid: !context.hasErrors(),
    }
  }

  /**
   * Cleanup method to release plugin resources.
   */
  public destroy(): void {
    this.registry.destroy()
  }
}
