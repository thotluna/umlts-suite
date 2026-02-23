import type { CompilerContext } from '@engine/compiler/phases/context'
import type { PipelineArtifacts } from '@engine/compiler/phases/pipeline-artifacts'

export interface CompilerPhase {
  run(context: CompilerContext, artifacts: PipelineArtifacts): void
}
