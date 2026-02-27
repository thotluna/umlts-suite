import { type DrawingContext } from './types'

/**
 * Essential interface for any component that can be rendered to SVG.
 */
export interface IDrawable {
  draw(ctx: DrawingContext): string
}
