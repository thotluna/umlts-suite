import { type IR, type DiagramConfig } from './core/types'
import { type Theme, lightTheme, darkTheme } from './core/theme'
import { IRAdapter } from './adaptation/ir-adapter'
import { LayoutEngine } from './layout/layout-engine'
import { SVGRenderer } from './drawing/svg-renderer'

export interface RenderOptions {
  theme?: 'light' | 'dark' | Theme
  config?: DiagramConfig
}

/**
 * UMLRenderer: The high-level orchestrator of the rendering pipeline.
 */
export class UMLRenderer {
  private readonly adapter = new IRAdapter()
  private readonly layoutEngine = new LayoutEngine()
  private readonly svgRenderer = new SVGRenderer()

  /**
   * Renders the given IR into an SVG string.
   */
  public async render(ir: IR, options: RenderOptions = {}): Promise<string> {
    const dslConfig = this.normalizeDSLConfig(ir.config)

    // Merge configuration: Defaults < Options (IDE/JSON) < IR (DSL)
    const mergedConfig: DiagramConfig = {
      ...options.config,
      ...dslConfig,
      layout: {
        ...options.config?.layout,
        ...dslConfig.layout,
      },
      render: {
        ...options.config?.render,
        ...dslConfig.render,
      },
    }

    const theme = this.resolveTheme(options.theme || mergedConfig.theme)

    // 1. Adaptation Phase
    let model = this.adapter.transform(ir)

    // 2. Filter Dependencies if needed (before layout to avoid empty space)
    if (mergedConfig.render?.showDependencies === false) {
      model = {
        ...model,
        edges: model.edges.filter((e) => e.type.toLowerCase() !== 'dependency'),
      }
    }

    // 3. Layout Phase
    // Pass merged config to layout engine (direction, spacing)
    const layoutResult = await this.layoutEngine.layout(model, mergedConfig.layout)

    // 4. Drawing Phase
    // Pass merged config to SVG renderer (render options)
    return this.svgRenderer.render(layoutResult, theme, mergedConfig.render)
  }

  private resolveTheme(themeOption?: string | Theme): Theme {
    if (!themeOption) return lightTheme
    if (themeOption === 'dark') return darkTheme
    if (themeOption === 'light') return lightTheme
    if (typeof themeOption === 'string') return lightTheme // Fallback for unknown theme strings
    return themeOption
  }

  /**
   * Transforma la configuración cruda del DSL (Record<string, unknown>)
   * a la interfaz estructurada DiagramConfig.
   */
  private normalizeDSLConfig(dslConfig?: Record<string, unknown>): DiagramConfig {
    if (dslConfig == null) return {}

    const config: DiagramConfig = {}

    if (dslConfig.theme) config.theme = dslConfig.theme as string

    // Mapeo de opciones de layout (solo si existen)
    const layout: NonNullable<DiagramConfig['layout']> = {}
    if (dslConfig.direction !== undefined)
      layout.direction = dslConfig.direction as NonNullable<DiagramConfig['layout']>['direction']
    if (dslConfig.spacing !== undefined) layout.spacing = dslConfig.spacing as number
    if (dslConfig.nodePadding !== undefined) layout.nodePadding = dslConfig.nodePadding as number
    if (dslConfig.routing !== undefined)
      layout.routing = dslConfig.routing as NonNullable<DiagramConfig['layout']>['routing']

    if (Object.keys(layout).length > 0) config.layout = layout

    // Mapeo de opciones de render (solo si existen)
    const render: NonNullable<DiagramConfig['render']> = {}

    if (dslConfig.showVisibility !== undefined)
      render.showVisibility = dslConfig.showVisibility as boolean
    if (dslConfig.showIcons !== undefined) render.showIcons = dslConfig.showIcons as boolean
    if (dslConfig.showDependencies !== undefined)
      render.showDependencies = dslConfig.showDependencies as boolean
    if (dslConfig.responsive !== undefined) render.responsive = dslConfig.responsive as boolean
    if (dslConfig.width !== undefined) render.width = dslConfig.width as string | number
    if (dslConfig.height !== undefined) render.height = dslConfig.height as string | number
    if (dslConfig.zoomLevel !== undefined) render.zoomLevel = dslConfig.zoomLevel as number

    if (Object.keys(render).length > 0) config.render = render

    return config
  }
}
