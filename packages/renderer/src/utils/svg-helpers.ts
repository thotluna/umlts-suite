
/**
 * Simple SVG string builders to maintain portability without a DOM.
 */

export interface SVGAttr {
  [key: string]: string | number | undefined;
}

function stringifyAttr(attrs: SVGAttr): string {
  return Object.entries(attrs)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
}

export function tag(name: string, attrs: SVGAttr, content?: string): string {
  const attrStr = stringifyAttr(attrs);
  if (content === undefined) {
    return `<${name} ${attrStr} />`;
  }
  return `<${name} ${attrStr}>${content}</${name}>`;
}

export function g(attrs: SVGAttr, content: string): string {
  return tag('g', attrs, content);
}

export function rect(attrs: SVGAttr): string {
  return tag('rect', attrs);
}

export function text(attrs: SVGAttr, content: string): string {
  // Simple escape for common XML entities
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return tag('text', attrs, escaped);
}

export function path(attrs: SVGAttr): string {
  return tag('path', attrs);
}

export function line(x1: number, y1: number, x2: number, y2: number, attrs: SVGAttr): string {
  return tag('line', { x1, y1, x2, y2, ...attrs });
}
