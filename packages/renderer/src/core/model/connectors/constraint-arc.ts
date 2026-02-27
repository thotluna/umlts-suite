import { UMLPathNode } from '../base/path-node.abstract'

export class UMLConstraintArc extends UMLPathNode {
  public label?: string
  public targets: string[] = []

  constructor(
    id: string,
    public kind: string,
    public expression?: string,
  ) {
    super(id)
  }
}
