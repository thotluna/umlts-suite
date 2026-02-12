import { IR, LayoutResult, DiagramConfig } from './core/types';
import { Theme, lightTheme, darkTheme } from './core/theme';
import { IRAdapter } from './adaptation/ir-adapter';
import { LayoutEngine } from './layout/layout-engine';
import { SVGRenderer } from './drawing/svg-renderer';

export interface RenderOptions {
  theme?: 'light' | 'dark' | Theme;
  config?: DiagramConfig;
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
    // Merge configuration: Defaults < Options (IDE/JSON) < IR (DSL)
    const mergedConfig: DiagramConfig = {
      ...options.config,
      ...this.normalizeDSLConfig(ir.config)
    };

    const theme = this.resolveTheme(options.theme || mergedConfig.theme);

    // 1. Adaptation Phase
    const model = this.adapter.transform(ir);

    // 2. Layout Phase
    // Pass merged config to layout engine (direction, spacing)
    const layoutResult = await this.layoutEngine.layout(model, mergedConfig.layout);

    // 3. Drawing Phase
    // Pass merged config to SVG renderer (render options)
    return this.svgRenderer.render(layoutResult, theme, mergedConfig.render);
  }

  private resolveTheme(themeOption?: string | Theme): Theme {
    if (!themeOption) return lightTheme;
    if (themeOption === 'dark') return darkTheme;
    if (themeOption === 'light') return lightTheme;
    if (typeof themeOption === 'string') return lightTheme; // Fallback for unknown theme strings
    return themeOption;
  }

  /**
   * Transforma la configuración cruda del DSL (Record<string, any>) 
   * a la interfaz estructurada DiagramConfig.
   */
  private normalizeDSLConfig(dslConfig?: Record<string, any>): DiagramConfig {
    if (!dslConfig) return {};

    const config: DiagramConfig = {};

    if (dslConfig.theme) config.theme = dslConfig.theme;

    // Mapeo simple de opciones de layout
    if (dslConfig.direction || dslConfig.spacing || dslConfig.nodePadding) {
      config.layout = {
        direction: dslConfig.direction as any,
        spacing: dslConfig.spacing,
        nodePadding: dslConfig.nodePadding
      };
    }

    // Mapeo simple de opciones de render
    if (dslConfig.showVisibility !== undefined || dslConfig.showIcons !== undefined) {
      config.render = {
        showVisibility: dslConfig.showVisibility,
        showIcons: dslConfig.showIcons
      };
    }

    return config;
  }
}
