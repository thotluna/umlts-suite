import { type IDrawable } from './drawable.interface'
import { type DrawingContext } from './types'

/**
 * Identity Root for all diagram elements.
 */
export abstract class UMLComponent implements IDrawable {
  public metadata: Map<string, unknown> = new Map()
  public isSelected = false
  public isHovered = false

  public constructor(public readonly id: string) {}

  /**
   * Default implementation returns empty string.
   */
  public draw(_ctx: DrawingContext): string {
    return ''
  }
}
