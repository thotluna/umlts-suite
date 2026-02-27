import { UMLEdge } from './edge.abstract'

export class UMLGeneralization extends UMLEdge {
  public override get type(): string {
    return 'Generalization'
  }
}
