
import { IR, LayoutResult } from './core/types';
import { Theme, lightTheme, darkTheme } from './core/theme';
import { IRAdapter } from './core/ir-adapter';
import { LayoutEngine } from './core/layout-engine';
import { SVGRenderer } from './core/svg-renderer';

export * from './core/types';
export * from './core/theme';

/**
 * Options for the rendering process.
 */
export interface RenderOptions {
  /**
   * The visual theme to apply. 
   * Can be 'light', 'dark', or a custom {Theme} object.
   */
  theme?: 'light' | 'dark' | Theme;
}

/**
 * Main entry point for rendering UMLTS diagrams to SVG.
 * 
 * @param ir - The Intermediate Representation object from ts-uml-engine.
 * @param options - Optional rendering configurations (theme, etc).
 * @returns A promise that resolves to the generated SVG string.
 */
export async function render(ir: IR, options: RenderOptions = {}): Promise<string> {
  // 1. Select Theme
  let theme: Theme = lightTheme;
  if (options.theme === 'dark') theme = darkTheme;
  else if (typeof options.theme === 'object') theme = options.theme;

  // 2. Pipeline
  const adapter = new IRAdapter();
  const layoutEngine = new LayoutEngine();
  const renderer = new SVGRenderer();

  // Step A: Adapt IR to Internal Model
  const model = adapter.transform(ir);

  // Step B: Calculate Layout
  const layoutResult = await layoutEngine.layout(model);

  // Step C: Generate SVG
  return renderer.render(layoutResult, theme);
}
