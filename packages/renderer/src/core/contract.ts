import { type DiagramModel } from './model/nodes'
import { type DiagramConfig, type LayoutResult } from './types'
import { type Theme } from './theme'

/**
 * Normalizes input from various sources (IR, Standard UML, JSON)
 * into the internal Rendering Domain Model.
 */
export interface IDataProvider<TSource> {
  provide(source: TSource): DiagramModel
}

/**
 * Responsible for positioning elements for a specific diagram type (Class, Sequence, etc).
 */
export interface ILayoutStrategy {
  /**
   * Determines if this strategy can handle the given model.
   */
  supports(model: DiagramModel): boolean

  /**
   * Performs the layout calculation with specific drawing rules.
   */
  layout(model: DiagramModel, config: DiagramConfig['layout']): Promise<LayoutResult>
}

/**
 * Transforms a layouted model into a visual represention (SVG, Canvas, etc).
 */
export interface IDrawingEngine<TOutput = string> {
  /**
   * Renders the diagram into the target output format.
   */
  draw(layoutResult: LayoutResult, theme: Theme, config: DiagramConfig['render']): TOutput
}

/**
 * Context that carries state and metadata through the rendering pipeline.
 * Facilitates interactvity by maintaining mappings between model and view.
 */
export interface IRenderPipelineContext {
  readonly diagramType: string
  readonly config: DiagramConfig
  readonly theme: Theme
  /**
   * Store for metadata used during rendering (e.g., entity IDs for drag & drop).
   */
  readonly metadata: Map<string, unknown>
}
