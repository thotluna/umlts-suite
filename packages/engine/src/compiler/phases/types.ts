import type { CompilerContext } from './context'
import type { PipelineArtifacts } from './pipeline-artifacts'

export interface CompilerPhase {
  run(context: CompilerContext, artifacts: PipelineArtifacts): void
}
