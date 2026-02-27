// --- Base and Infrastructure ---
import { UMLSpatialNode } from './base/spatial-node.abstract'
import { UMLEdge } from './connectors/edge.abstract'
import { UMLAnchor } from './connectors/anchor'
import { UMLConstraintArc } from './connectors/constraint-arc'
import { UMLShape } from './shapes/shape.abstract'
import { UMLPackage } from './shapes/package'
import { UMLNote } from './shapes/note'

import { type DiagramConfig } from '../types'

export * from './base/types'
export * from './base/drawable.interface'
export * from './base/component.abstract'
export * from './base/spatial-node.abstract'
export * from './base/path-node.abstract'
export * from './base/content-node.abstract'

// --- Content (Atoms) ---
export * from './content/text'
export * from './content/name'
export * from './content/stereotype'
export * from './content/member'
export * from './content/label'
export * from './content/template-box'

// --- Shapes (Spatial) ---
export * from './shapes/shape.abstract'
export * from './shapes/header-shape.abstract'
export * from './shapes/compartment-node.abstract'
export * from './shapes/class'
export * from './shapes/active-class'
export * from './shapes/static-class'
export * from './shapes/generic-class'
export * from './shapes/interface'
export * from './shapes/generic-interface'
export * from './shapes/enum'
export * from './shapes/data-type'
export * from './shapes/package'
export * from './shapes/note'

// --- Connectors (Paths) ---
export * from './connectors/constraint-arc'
export * from './connectors/edge.abstract'
export * from './connectors/generalization'
export * from './connectors/realization'
export * from './connectors/dependency'
export * from './connectors/association'
export * from './connectors/aggregation'
export * from './connectors/composition'
export * from './connectors/anchor'

/**
 * DiagramModel: The complete object containing all components of a diagram.
 */
export interface DiagramModel {
  components: (UMLSpatialNode | UMLEdge | UMLAnchor | UMLConstraintArc)[]
  nodes: (UMLShape | UMLPackage)[]
  edges: UMLEdge[]
  packages: UMLPackage[]
  notes: UMLNote[]
  anchors: UMLAnchor[]
  constraints: UMLConstraintArc[]
  config: DiagramConfig
}

/**
 * Utility type to represent any node that can be part of the ELK hierarchy.
 */
export type UMLNode = UMLSpatialNode
