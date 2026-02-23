import type { Token } from '@engine/syntax/token.types'
import type { ProgramNode } from '@engine/syntax/nodes'
import type { IRDiagram } from '@engine/generator/ir/models'

export class PipelineArtifacts {
  public tokens: Token[] = []
  public ast: ProgramNode | null = null
  public diagram: IRDiagram | null = null
}
