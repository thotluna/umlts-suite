import { UMLShape } from './shape.abstract'
import { type UMLText } from '../content/text'
import { type DrawingContext } from '../base/types'

export class UMLNote extends UMLShape {
  public content?: UMLText

  public override get type(): string {
    return 'Note'
  }

  public get text(): string {
    return this.content?.text || ''
  }

  public override draw(_ctx: DrawingContext): string {
    return ''
  }
}
