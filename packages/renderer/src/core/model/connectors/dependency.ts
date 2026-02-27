import { UMLEdge } from './edge.abstract'

export class UMLDependency extends UMLEdge {
  public override get type(): string {
    return 'Dependency'
  }
}
