import { CompilerContext } from '@engine/compiler/phases/context'
import { PhasesFactory } from '@engine/compiler/phases/phases.factory'
import { PipelineArtifacts } from '@engine/compiler/phases/pipeline-artifacts'
import { ParseResult } from '@engine/generator/types'

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
