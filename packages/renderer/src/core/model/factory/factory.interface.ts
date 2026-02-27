import { IREntity, IRRelationship, IRNote } from '@umlts/engine'
import { UMLNode, UMLEdge, UMLAnchor, UMLPackage, UMLNote } from '../index'

/**
 * Contract for the model factory to ensure DI compatibility.
 */
export interface IModelFactory {
  createNode(entity: IREntity): UMLNode
  /**
   * Transforms an IRRelationship into a concrete UMLEdge or Connector.
   */
  createEdge(rel: IRRelationship, id?: string): UMLEdge
  createNote(irNote: IRNote): UMLNote
  createPackage(id: string, name: string): UMLPackage
  createAnchor(id: string, fromId: string, toIds: string[]): UMLAnchor
}
