import { IREntity, IREntityType } from '@umlts/engine'
import {
  UMLClass,
  UMLActiveClass,
  UMLStaticClass,
  UMLGenericClass,
  UMLNode,
  UMLTemplateBox,
  UMLText,
} from '../../../index'
import { EntityMapper } from '../../mapper.interface'
import { MappingContext } from '../../context'
import { NodeSpecializer } from '../../specializers'

export class ClassMapper implements EntityMapper {
  private readonly specializers: NodeSpecializer[] = [
    {
      predicate: (e: IREntity): boolean => !!e.isActive,
      creator: (id: string): UMLNode => new UMLActiveClass(id),
    },
    {
      predicate: (e: IREntity): boolean => !!e.isStatic,
      creator: (id: string): UMLNode => new UMLStaticClass(id),
    },
    {
      predicate: (e: IREntity): boolean => !!(e.typeParameters && e.typeParameters.length > 0),
      creator: (id: string): UMLNode => new UMLGenericClass(id),
    },
  ]

  public canMap(entity: IREntity): boolean {
    return entity.type === IREntityType.CLASS || !entity.type // Default to class
  }

  public map(entity: IREntity, context: MappingContext): UMLNode {
    // Declarative selection of the base instance
    const specializer = this.specializers.find((s) => s.predicate(entity))
    const node = specializer ? specializer.creator(entity.id) : new UMLClass(entity.id)

    // Composition of template box if generic
    if (node instanceof UMLGenericClass && entity.typeParameters) {
      const tbox = new UMLTemplateBox(`${entity.id}_template`)
      tbox.parameters = entity.typeParameters.map(
        (tp: string, i: number) => new UMLText(`${node.id}_tp_${i}`, tp),
      )
      node.templateBox = tbox
    }

    context.applyCommonMetadata(node as UMLClass, entity)
    context.mapCompartments(node as UMLClass, entity)

    return node
  }
}
