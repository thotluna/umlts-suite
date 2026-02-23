import type { Token } from '../../syntax/token.types'
import { type AttributeNode, type Modifiers } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import { MemberSuffixRule } from './member-suffix.rule'
import { ASTFactory } from '../factory/ast.factory'

export class AttributeRule {
  public parse(
    context: IParserHub,
    name: Token,
    visibility: string,
    modifiers: Modifiers,
  ): AttributeNode {
    const suffix = MemberSuffixRule.parse(context)

    return ASTFactory.createAttribute(
      name.value,
      visibility,
      suffix.typeAnnotation,
      modifiers,
      name.line,
      name.column,
      {
        multiplicity: suffix.multiplicity,
        relationshipKind: suffix.relationshipKind,
        isNavigable: suffix.isNavigable,
        label: suffix.label,
        constraints: suffix.constraints,
        targetModifiers: suffix.targetModifiers,
        docs: context.consumePendingDocs(),
      },
    )
  }
}
