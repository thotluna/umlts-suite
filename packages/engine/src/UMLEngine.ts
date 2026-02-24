import { CompilerContext } from '@engine/compiler/phases/context'
import { PhasesFactory } from '@engine/compiler/phases/phases.factory'
import { PipelineArtifacts } from '@engine/compiler/phases/pipeline-artifacts'
import { ParseResult } from '@engine/generator/types'
import { ConfigPreScanner } from '@engine/compiler/pre-scanner'

export class UMLEngine {
  private readonly factory = new PhasesFactory()
  private readonly phases = this.factory.getPhases()

  public parse(source: string): ParseResult {
    // 1. Pre-scan for configuration (Early activation)
    const activeLanguage = ConfigPreScanner.scanLanguage(source)
    if (activeLanguage) {
      this.factory.activateLanguage(activeLanguage)
    }

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
