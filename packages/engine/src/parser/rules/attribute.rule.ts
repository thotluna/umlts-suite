import type { Token } from '../../syntax/token.types'
import { ASTNodeType, type AttributeNode, type Modifiers } from '../../syntax/nodes'
import type { IParserHub } from '../parser.context'
import { MemberSuffixRule } from './member-suffix.rule'

export class AttributeRule {
  public parse(
    context: IParserHub,
    name: Token,
    visibility: string,
    modifiers: Modifiers,
  ): AttributeNode {
    const suffix = MemberSuffixRule.parse(context)

    return {
      type: ASTNodeType.ATTRIBUTE,
      name: name.value,
      visibility,
      modifiers,
      typeAnnotation: suffix.typeAnnotation,
      multiplicity: suffix.multiplicity,
      relationshipKind: suffix.relationshipKind,
      isNavigable: suffix.isNavigable,
      label: suffix.label,
      constraints: suffix.constraints,
      targetModifiers: suffix.targetModifiers,
      docs: context.consumePendingDocs(),
      line: name.line,
      column: name.column,
    }
  }
}
