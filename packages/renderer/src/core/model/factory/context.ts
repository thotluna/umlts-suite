import { IREntity, IRProperty, IROperation, IRRelationship } from '@umlts/engine'
import {
  UMLName,
  UMLStereotype,
  UMLMember,
  UMLHeaderShape,
  UMLCompartmentNode,
  UMLEdge,
} from '../index'

/**
 * MappingContext: Shared utilities for mappers to avoid duplication.
 */
export class MappingContext {
  /**
   * Applies common branding/styling from IR to a HeaderShape.
   */
  public applyCommonMetadata(node: UMLHeaderShape, entity: IREntity): void {
    const title = new UMLName(`${entity.id}_title`, entity.name)
    node.setName(title)

    if (entity.isAbstract) {
      if (node.nameContent) node.nameContent.isItalic = true
      node.addStereotype(new UMLStereotype(`${entity.id}_st_abs`, 'abstract'))
    }

    if (entity.isStatic) {
      node.addStereotype(new UMLStereotype(`${entity.id}_st_static`, 'static'))
    }

    if (entity.stereotypes) {
      entity.stereotypes.forEach((st, i) => {
        node.addStereotype(new UMLStereotype(`${entity.id}_st_${i}`, st))
      })
    }

    // Assign namespace for correct hierarchy layout
    node.namespace = entity.namespace
  }

  /**
   * Populates a compartment node with properties and operations.
   */
  public mapCompartments(node: UMLCompartmentNode, entity: IREntity): void {
    entity.properties?.forEach((prop: IRProperty, i: number) => {
      const m = new UMLMember(`${entity.id}_p_${i}`, prop.name)
      m.type = prop.type
      m.visibility = prop.visibility
      m.isStatic = prop.isStatic
      m.isLeaf = prop.isLeaf
      node.addProperty(m)
    })

    entity.operations?.forEach((op: IROperation, i: number) => {
      const m = new UMLMember(`${entity.id}_op_${i}`, op.name)
      m.visibility = op.visibility
      m.isStatic = op.isStatic
      m.isAbstract = op.isAbstract
      m.isLeaf = op.isLeaf
      m.parameters = op.parameters
      m.returnType = op.returnType
      m.returnMultiplicity = op.returnMultiplicity
      node.addOperation(m)
    })
  }

  /**
   * Applies labels and multiplicities to edges.
   */
  public applyCommonEdgeMetadata(edge: UMLEdge, rel: IRRelationship): void {
    edge.label = rel.label
    edge.fromMultiplicity = rel.fromMultiplicity
    edge.toMultiplicity = rel.toMultiplicity
  }
}
