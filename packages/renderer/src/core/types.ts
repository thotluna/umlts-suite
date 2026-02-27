import type { LayoutConfig } from '../graph-orchestrator/types'
import type { DiagramModel, UMLNode } from './model/index'

/**
 * Resultado del proceso de layout.
 * Contiene el modelo transformado y sus dimensiones calculadas.
 */
export interface LayoutResult {
  model: DiagramModel
  totalWidth: number
  totalHeight: number
  bbox?: { x: number; y: number; width: number; height: number }
}

/**
 * Configuración global del renderizado.
 */
export interface DiagramConfig {
  theme?: string
  layout?: LayoutConfig
  render?: {
    showVisibility?: boolean
    showIcons?: boolean
    showAbstractItalic?: boolean
    showDependencies?: boolean
    responsive?: boolean
    width?: number | string
    height?: number | string
    zoomLevel?: number
    /** @internal Mapa de nodos para consultas rápidas durante el renderizado de edges */
    nodes?: Map<string, UMLNode>
  }
}
