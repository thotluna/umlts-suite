import type { Token } from '../../syntax/token.types'
import type { ProgramNode } from '../../syntax/nodes'
import type { IRDiagram } from '../../generator/ir/models'

export class PipelineArtifacts {
  public tokens: Token[] = []
  public ast: ProgramNode | null = null
  public diagram: IRDiagram | null = null
}
