import { type DiagramConfig } from './types'

/**
 * ConfigProcessor: Centralizes the logic for normalizing and merging
 * configurations from various sources (DSL, Options, Defaults).
 */
export class ConfigProcessor {
  /**
   * Transforms raw DSL configuration (Record<string, unknown>)
   * into the structured DiagramConfig interface.
   */
  public static normalize(dslConfig?: Record<string, unknown>): DiagramConfig {
    if (dslConfig == null) return {}

    const config: DiagramConfig = {}

    if (dslConfig.theme) config.theme = dslConfig.theme as string

    // Mapping layout options
    const layout: NonNullable<DiagramConfig['layout']> = {}
    if (dslConfig.direction !== undefined) {
      layout.direction = dslConfig.direction as NonNullable<DiagramConfig['layout']>['direction']
    }
    if (dslConfig.spacing !== undefined) layout.spacing = dslConfig.spacing as number
    if (dslConfig.nodePadding !== undefined) layout.nodePadding = dslConfig.nodePadding as number
    if (dslConfig.routing !== undefined) {
      layout.routing = dslConfig.routing as NonNullable<DiagramConfig['layout']>['routing']
    }

    if (Object.keys(layout).length > 0) config.layout = layout

    // Mapping render options
    const render: NonNullable<DiagramConfig['render']> = {}
    if (dslConfig.showVisibility !== undefined) {
      render.showVisibility = dslConfig.showVisibility as boolean
    }
    if (dslConfig.showIcons !== undefined) render.showIcons = dslConfig.showIcons as boolean
    if (dslConfig.showDependencies !== undefined) {
      render.showDependencies = dslConfig.showDependencies as boolean
    }
    if (dslConfig.responsive !== undefined) render.responsive = dslConfig.responsive as boolean
    if (dslConfig.width !== undefined) render.width = dslConfig.width as string | number
    if (dslConfig.height !== undefined) render.height = dslConfig.height as string | number
    if (dslConfig.zoomLevel !== undefined) render.zoomLevel = dslConfig.zoomLevel as number

    if (Object.keys(render).length > 0) config.render = render

    return config
  }

  /**
   * Merges two configurations with deep merge for layout and render sections.
   * Precedence: first (base) < second (override)
   */
  public static merge(base?: DiagramConfig, override?: DiagramConfig): DiagramConfig {
    return {
      ...base,
      ...override,
      layout: {
        ...base?.layout,
        ...override?.layout,
      },
      render: {
        ...base?.render,
        ...override?.render,
      },
    }
  }
}
