export interface Size {
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

/**
 * Port side definition for ELK.
 */
export type PortSide = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST'

/**
 * Connection point for edges on a node.
 */
export interface UMLPort {
  id: string
  side: PortSide
  x: number
  y: number
}

/**
 * Drawing context provided to each drawable component.
 */
export interface DrawingContext {
  theme: Record<string, string>
  svg: unknown // SVGBuilder
  config: Record<string, unknown>
}
