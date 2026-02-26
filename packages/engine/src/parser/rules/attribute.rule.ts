import type { Token } from '@engine/syntax/token.types'
import { type AttributeNode, type Modifiers } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import { MemberSuffixRule } from '@engine/parser/rules/member-suffix.rule'
import { ASTFactory } from '@engine/parser/factory/ast.factory'
import type { Orchestrator } from '@engine/parser/rule.types'

export class AttributeRule {
  public parse(
    context: IParserHub,
    name: Token,
    visibility: string,
    modifiers: Modifiers,
    _orchestrator: Orchestrator,
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
        notes: suffix.notes,
      },
    )
  }
}
