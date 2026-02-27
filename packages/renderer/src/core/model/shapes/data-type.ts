import { UMLCompartmentNode } from './compartment-node.abstract'

export class UMLDataType extends UMLCompartmentNode {
  public override get type(): string {
    return 'DataType'
  }
}
