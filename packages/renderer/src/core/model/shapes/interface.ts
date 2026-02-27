import { UMLCompartmentNode } from './compartment-node.abstract'

export class UMLInterface extends UMLCompartmentNode {
  public override get type(): string {
    return 'Interface'
  }
}
