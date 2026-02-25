import { type DiagramConfig } from '@renderer/core/types'
import { type Theme, lightTheme, darkTheme } from '@renderer/core/theme'
import {
  type IDataProvider,
  type ILayoutStrategy,
  type IDrawingEngine,
} from '@renderer/core/contract'

export interface RenderOptions {
  theme?: 'light' | 'dark' | Theme
  config?: DiagramConfig
}

/**
 * UMLRendererV3: The modular orchestrator using Dependency Injection.
 * Supports any input source and any output format through its injected components.
 */
export class UMLRendererV3<TSource, TOutput = string> {
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
    let model = this.provider.provide(source)

    // 2. Configuration & Theme Resolution
    const mergedConfig = this.mergeConfig(options.config)
    const theme = this.resolveTheme(options.theme || mergedConfig.theme)

    // 3. Normalization/Pre-processing Phase
    // (Future: this could be another injected stage)
    if (mergedConfig.render?.showDependencies === false) {
      model = {
        ...model,
        edges: model.edges.filter((e) => e.type.toLowerCase() !== 'dependency'),
      }
    }

    // 4. Layout Phase
    if (!this.layoutStrategy.supports(model)) {
      throw new Error('The provided layout strategy does not support this diagram model.')
    }
    const layoutResult = await this.layoutStrategy.layout(model, mergedConfig.layout)

    // 5. Drawing Phase
    return this.drawingEngine.draw(layoutResult, theme, mergedConfig.render || {})
  }

  private resolveTheme(themeOption?: string | Theme): Theme {
    if (!themeOption) return lightTheme
    if (themeOption === 'dark') return darkTheme
    if (themeOption === 'light') return lightTheme
    if (typeof themeOption === 'string') return lightTheme
    return themeOption
  }

  private mergeConfig(optionsConfig?: DiagramConfig): DiagramConfig {
    // Simplified merge for now, prioritizing options
    return {
      ...optionsConfig,
      layout: { ...optionsConfig?.layout },
      render: { ...optionsConfig?.render },
    }
  }
}
