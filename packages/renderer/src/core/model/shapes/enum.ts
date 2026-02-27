import { UMLHeaderShape } from './header-shape.abstract'
import { type UMLMember } from '../content/member'

export class UMLEnum extends UMLHeaderShape {
  public literals: UMLMember[] = []

  public override get type(): string {
    return 'Enum'
  }
}
