import { UMLSpatialNode } from '../base/spatial-node.abstract'
import { type UMLShape } from './shape.abstract'
import { type UMLNote } from './note'
import { type DrawingContext } from '../base/types'

export class UMLPackage extends UMLSpatialNode {
  private _packageName = ''
  public children: (UMLPackage | UMLShape | UMLNote)[] = []

  constructor(id: string, name: string) {
    super(id)
    this._packageName = name
  }

  public override get name(): string {
    return this._packageName
  }

  public override get type(): string {
    return 'Package'
  }

  public override draw(_ctx: DrawingContext): string {
    return ''
  }
}
