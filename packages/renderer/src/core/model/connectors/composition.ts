import { UMLAssociation } from './association'

export class UMLComposition extends UMLAssociation {
  constructor(id: string, from: string, to: string) {
    super(id, from, to)
    this.isComposition = true
  }

  public override get type(): string {
    return 'Composition'
  }
}
