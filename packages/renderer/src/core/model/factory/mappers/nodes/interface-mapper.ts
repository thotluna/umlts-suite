import { IREntity, IREntityType } from '@umlts/engine'
import { UMLInterface, UMLGenericInterface, UMLNode, UMLTemplateBox, UMLText } from '../../../index'
import { EntityMapper } from '../../mapper.interface'
import { MappingContext } from '../../context'

export class InterfaceMapper implements EntityMapper {
  public canMap(entity: IREntity): boolean {
    return entity.type === IREntityType.INTERFACE
  }

  public map(entity: IREntity, context: MappingContext): UMLNode {
    let node: UMLInterface

    if (entity.typeParameters && entity.typeParameters.length > 0) {
      node = new UMLGenericInterface(entity.id)
      const tbox = new UMLTemplateBox(`${entity.id}_template`)
      tbox.parameters = entity.typeParameters.map((tp, i) => new UMLText(`${node.id}_tp_${i}`, tp))
      node.templateBox = tbox
    } else {
      node = new UMLInterface(entity.id)
    }

    context.applyCommonMetadata(node, entity)
    context.mapCompartments(node, entity)

    return node
  }
}
