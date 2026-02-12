
import { Theme } from '../core/theme';

/**
 * Interface for elements that can be rendered to SVG.
 */
export interface Drawable {
  draw(theme: Theme): string;
}

/**
 * Registry for element renderers to follow Open/Closed principle.
 */
export class DrawingRegistry {
  private static renderers = new Map<string, (element: any, theme: Theme, options?: any) => string>();

  public static register(type: string, renderer: (element: any, theme: Theme, options?: any) => string): void {
    this.renderers.set(type, renderer);
  }

  public static render(type: string, element: any, theme: Theme, options?: any): string {
    const renderer = this.renderers.get(type);
    if (!renderer) {
      console.warn(`No renderer registered for type: ${type}`);
      return '';
    }
    return renderer(element, theme, options);
  }
}
