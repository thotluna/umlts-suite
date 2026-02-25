import { type DiagramConfig } from './types'
import { type Theme, lightTheme, darkTheme } from './theme'
import { type IDataProvider, type ILayoutStrategy, type IDrawingEngine } from './contract'
import { ConfigProcessor } from './config-processor'

export interface RenderOptions {
  theme?: 'light' | 'dark' | Theme
  config?: DiagramConfig
}

/**
 * DiagramRenderer: The modular orchestrator using Dependency Injection.
 * Supports any input source and any output format through its injected components.
 */
export class DiagramRenderer<TSource, TOutput = string> {
  constructor(
    private readonly provider: IDataProvider<TSource>,
    private readonly layoutStrategy: ILayoutStrategy,
    private readonly drawingEngine: IDrawingEngine<TOutput>,
  ) {}

  /**
   * Renders the given source into the target output format.
   */
  public async render(source: TSource, options: RenderOptions = {}): Promise<TOutput> {
    // 1. Data Adaptation Phase
    const model = this.provider.provide(source)

    // 2. Configuration & Theme Resolution
    // Precedencia: Opciones externas < Configuración del Modelo (DSL)
    const mergedConfig = ConfigProcessor.merge(options.config, model.config)
    const theme = this.resolveTheme(options.theme || mergedConfig.theme)

    // 3. Layout Phase
    if (!this.layoutStrategy.supports(model)) {
      throw new Error('The provided layout strategy does not support this diagram model.')
    }
    const layoutResult = await this.layoutStrategy.layout(model, mergedConfig.layout)

    // 4. Drawing Phase
    return this.drawingEngine.draw(layoutResult, theme, mergedConfig.render || {})
  }

  private resolveTheme(themeOption?: string | Theme): Theme {
    if (!themeOption) return lightTheme
    if (themeOption === 'dark') return darkTheme
    if (themeOption === 'light') return lightTheme
    if (typeof themeOption === 'string') return lightTheme
    return themeOption
  }
}
