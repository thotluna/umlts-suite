import { UMLClass } from './class'

export class UMLStaticClass extends UMLClass {
  constructor(id: string) {
    super(id)
    this.isStatic = true
  }

  public override get type(): string {
    return 'StaticClass'
  }
}
