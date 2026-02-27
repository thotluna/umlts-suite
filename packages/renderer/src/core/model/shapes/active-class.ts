import { UMLClass } from './class'

export class UMLActiveClass extends UMLClass {
  constructor(id: string) {
    super(id)
    this.isActive = true
  }

  public override get type(): string {
    return 'ActiveClass'
  }
}
