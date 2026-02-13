import { type Theme } from '../core/theme'

/**
 * Interface for elements that can be rendered to SVG.
 */
export interface Drawable {
  draw: (theme: Theme) => string
}

/**
 * Registry for element renderers to follow Open/Closed principle.
 */
export class DrawingRegistry {
  private static readonly renderers = new Map<
    string,
    (element: unknown, theme: Theme, options?: unknown) => string
  >()

  public static register(
    type: string,
    renderer: (element: unknown, theme: Theme, options?: unknown) => string,
  ): void {
    this.renderers.set(type, renderer)
  }

  public static render(type: string, element: unknown, theme: Theme, options?: unknown): string {
    const renderer = this.renderers.get(type)
    if (renderer == null) {
      console.warn(`No renderer registered for type: ${type}`)
      return ''
    }
    return renderer(element, theme, options)
  }
}
