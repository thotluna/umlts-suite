import { UMLInterface } from './interface'

export class UMLGenericInterface extends UMLInterface {
  public override get type(): string {
    return 'GenericInterface'
  }
}
