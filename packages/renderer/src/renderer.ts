import { IR, LayoutResult } from './core/types';
import { Theme, lightTheme, darkTheme } from './core/theme';
import { IRAdapter } from './adaptation/ir-adapter';
import { LayoutEngine } from './layout/layout-engine';
import { SVGRenderer } from './drawing/svg-renderer';

export interface RenderOptions {
  theme?: 'light' | 'dark' | Theme;
}

/**
 * UMLRenderer: The high-level orchestrator of the rendering pipeline.
 */
export class UMLRenderer {
  private adapter = new IRAdapter();
  private layoutEngine = new LayoutEngine();
  private svgRenderer = new SVGRenderer();

  /**
   * Renders the given IR into an SVG string.
   */
  public async render(ir: IR, options: RenderOptions = {}): Promise<string> {
    const theme = this.resolveTheme(options.theme);

    // 1. Adaptation Phase
    const model = this.adapter.transform(ir);

    // 2. Layout Phase
    const layoutResult = await this.layoutEngine.layout(model);

    // 3. Drawing Phase
    return this.svgRenderer.render(layoutResult, theme);
  }

  private resolveTheme(themeOption?: 'light' | 'dark' | Theme): Theme {
    if (!themeOption) return lightTheme;
    if (themeOption === 'dark') return darkTheme;
    if (themeOption === 'light') return lightTheme;
    return themeOption;
  }
}
