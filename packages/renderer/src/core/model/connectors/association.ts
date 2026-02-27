import { UMLEdge } from './edge.abstract'

export class UMLAssociation extends UMLEdge {
  public isNavigable = false
  public isAggregation = false // Deprecated: use UMLAggregation
  public isComposition = false // Deprecated: use UMLComposition

  public override get type(): string {
    return 'Association'
  }
}
