import { type IRDiagram } from '@umlts/engine'
import { UMLRenderer, type RenderOptions } from './renderer'

export * from './core/types'
export * from './core/theme'
export * from './core/model/index'

export { UMLRenderer, type RenderOptions } from './renderer'

/**
 * Main entry point for rendering UMLTS diagrams to SVG.
 *
 * @param ir - The Intermediate Representation object from @umlts/engine.
 * @param options - Optional rendering configurations (theme, etc).
 * @returns A promise that resolves to the generated SVG string.
 */
export async function render(ir: IRDiagram, options: RenderOptions = {}): Promise<string> {
  const renderer = new UMLRenderer()
  return await renderer.render(ir, options)
}
