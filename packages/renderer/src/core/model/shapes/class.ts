import { UMLCompartmentNode } from './compartment-node.abstract'

export class UMLClass extends UMLCompartmentNode {
  public isActive = false
  public isStatic = false
  public isLeaf = false

  public override get type(): string {
    return 'Class'
  }

  public override get isAbstract(): boolean {
    return this.stereotypes.some((s) => s.text.includes('abstract'))
  }
}
