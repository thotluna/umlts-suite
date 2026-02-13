/**
 * Simple SVG string builders to maintain portability without a DOM.
 */

export type SVGAttr = Record<string, string | number | undefined>

/**
 * SVGBuilder: Simple SVG string builders to maintain portability without a DOM.
 */
export class SVGBuilder {
  public static tag(name: string, attrs: SVGAttr, content?: string): string {
    const attrStr = this.stringifyAttr(attrs)
    if (content === undefined) {
      return `<${name} ${attrStr} />`
    }
    return `<${name} ${attrStr}>${content}</${name}>`
  }

  public static g(attrs: SVGAttr, content: string): string {
    return this.tag('g', attrs, content)
  }

  public static rect(attrs: SVGAttr): string {
    return this.tag('rect', attrs)
  }

  public static text(attrs: SVGAttr, content: string): string {
    // Simple escape for common XML entities
    const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return this.tag('text', attrs, escaped)
  }

  public static path(attrs: SVGAttr): string {
    return this.tag('path', attrs)
  }

  public static line(x1: number, y1: number, x2: number, y2: number, attrs: SVGAttr): string {
    return this.tag('line', { x1, y1, x2, y2, ...attrs })
  }

  private static stringifyAttr(attrs: SVGAttr): string {
    return Object.entries(attrs)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ')
  }
}
