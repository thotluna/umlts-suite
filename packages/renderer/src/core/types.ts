import { type DiagramModel, type UMLNode } from './model/nodes'

export type * from './contract/ir'
export * from './model/nodes'

export interface LayoutResult {
  model: DiagramModel
  totalWidth: number
  totalHeight: number
  bbox?: { x: number; y: number; width: number; height: number }
}

export interface DiagramConfig {
  theme?: string
  layout?: {
    direction?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
    spacing?: number
    nodePadding?: number
    routing?: 'ORTHOGONAL' | 'SPLINES' | 'POLYLINE'
  }
  render?: {
    showVisibility?: boolean
    showIcons?: boolean
    showAbstractItalic?: boolean
    /** Si es true, el SVG ocupará el 100% de su contenedor y se auto-ajustará */
    responsive?: boolean
    /** Ancho objetivo para el renderizado (si no es responsive) */
    width?: number | string
    /** Alto objetivo para el renderizado (si no es responsive) */
    height?: number | string
    /** Nivel de zoom relativo (1.0 = 100%). Menor a 1.0 aleja, mayor acerca. */
    zoomLevel?: number
    /** @internal Mapa de nodos para consultas rápiads durante el renderizado de edges */
    nodes?: Map<string, UMLNode>
  }
}
