import { UMLEdge } from './edge.abstract'

export class UMLRealization extends UMLEdge {
  public override get type(): string {
    return 'Realization'
  }
}
