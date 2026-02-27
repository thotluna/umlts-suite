import { UMLClass } from './class'

export class UMLGenericClass extends UMLClass {
  public override get type(): string {
    return 'GenericClass'
  }
}
