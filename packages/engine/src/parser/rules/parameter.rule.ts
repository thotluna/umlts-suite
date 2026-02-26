import { TokenType } from '@engine/syntax/token.types'
import { type ParameterNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import { MemberSuffixRule } from '@engine/parser/rules/member-suffix.rule'
import { ASTFactory } from '@engine/parser/factory/ast.factory'

export class ParameterRule {
  public parse(context: IParserHub): ParameterNode {
    const paramName = context.consume(TokenType.IDENTIFIER, 'Parameter name expected')
    const suffix = MemberSuffixRule.parse(context)

    return ASTFactory.createParameter(
      paramName.value,
      suffix.typeAnnotation,
      paramName.line,
      paramName.column,
      {
        relationshipKind: suffix.relationshipKind,
        isNavigable: suffix.isNavigable,
        targetModifiers: suffix.targetModifiers,
        multiplicity: suffix.multiplicity,
        constraints: suffix.constraints,
        notes: suffix.notes,
      },
    )
  }
}
