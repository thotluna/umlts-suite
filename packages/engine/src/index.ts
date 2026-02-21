import { CompilerContext } from './compiler/phases/context'
import { PipelineArtifacts } from './compiler/phases/pipeline-artifacts'
import { PhasesFactory } from './compiler/phases/phases.factory'
import { ParseResult } from './generator/types'

export class UMLEngine {
  private readonly factory = new PhasesFactory()
  private readonly phases = this.factory.getPhases()

  public parse(source: string): ParseResult {
    const context = new CompilerContext(source, this.factory.getPlugin())
    const artifacts = new PipelineArtifacts()

    for (const phase of this.phases) {
      phase.run(context, artifacts)
      if (context.hasErrors()) break
    }

    return {
      diagram: artifacts.diagram!,
      diagnostics: context.diagnostics,
      isValid: !context.hasErrors(),
    }
  }
}
