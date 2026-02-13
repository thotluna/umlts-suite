import { IR } from './core/types'
import { UMLRenderer, RenderOptions } from './renderer'

export * from './core/types'
export * from './core/theme'

export { UMLRenderer, RenderOptions } from './renderer'

/**
 * Main entry point for rendering UMLTS diagrams to SVG.
 *
 * @param ir - The Intermediate Representation object from ts-uml-engine.
 * @param options - Optional rendering configurations (theme, etc).
 * @returns A promise that resolves to the generated SVG string.
 */
export async function render(ir: IR, options: RenderOptions = {}): Promise<string> {
  const renderer = new UMLRenderer()
  return renderer.render(ir, options)
}
