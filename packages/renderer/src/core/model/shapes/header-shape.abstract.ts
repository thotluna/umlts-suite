import { UMLShape } from './shape.abstract'
import { type UMLName } from '../content/name'
import { type UMLStereotype } from '../content/stereotype'

import { MEASURE_CONFIG } from '../base/measure-constants'

/**
 * Shapes with stereotypes and names (Classes, Interfaces, etc.)
 */
export abstract class UMLHeaderShape extends UMLShape {
  public nameContent?: UMLName
  public stereotypes: UMLStereotype[] = []

  public setName(name: UMLName): void {
    this.nameContent = name
  }

  public override get name(): string {
    return this.nameContent?.text || this.id
  }

  public addStereotype(st: UMLStereotype): void {
    this.stereotypes.push(st)
  }

  public getHeaderHeight(): number {
    const { HEADER_HEIGHT_NORMAL, STEREOTYPE_HEIGHT } = MEASURE_CONFIG
    return HEADER_HEIGHT_NORMAL + this.stereotypes.length * STEREOTYPE_HEIGHT
  }
}
