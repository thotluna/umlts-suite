import type { CompilerContext } from './context'

export interface CompilerPhase {
  run(context: CompilerContext): Promise<void> | void
}
