import { IREntity, IREntityType, IRProperty } from '@umlts/engine'
import { UMLEnum, UMLDataType, UMLNode, UMLMember } from '../../../index'
import { EntityMapper } from '../../mapper.interface'
import { MappingContext } from '../../context'

export class EnumMapper implements EntityMapper {
  public canMap(entity: IREntity): boolean {
    return entity.type === IREntityType.ENUMERATION
  }

  public map(entity: IREntity, context: MappingContext): UMLNode {
    const node = new UMLEnum(entity.id)
    context.applyCommonMetadata(node, entity)

    entity.properties?.forEach((prop: IRProperty, i: number) => {
      const m = new UMLMember(`${entity.id}_lit_${i}`, prop.name)
      node.literals.push(m)
    })

    return node
  }
}

export class DataTypeMapper implements EntityMapper {
  public canMap(entity: IREntity): boolean {
    return entity.type === IREntityType.DATA_TYPE
  }

  public map(entity: IREntity, context: MappingContext): UMLNode {
    const node = new UMLDataType(entity.id)
    context.applyCommonMetadata(node, entity)
    context.mapCompartments(node, entity)
    return node
  }
}
