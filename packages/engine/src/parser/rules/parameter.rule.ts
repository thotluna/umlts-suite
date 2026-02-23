import { TokenType } from '../../syntax/token.types'
import { type ParameterNode, type ConstraintNode } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import { TypeRule } from './type.rule'
import { ConstraintRule } from './constraint.rule'
import { ModifierRule } from './modifier.rule'
import { ASTFactory } from '../factory/ast.factory'

export class ParameterRule {
  private readonly typeRule = new TypeRule()

  public parse(context: IParserHub): ParameterNode {
    const paramName = context.consume(TokenType.IDENTIFIER, 'Parameter name expected')
    context.consume(TokenType.COLON, "Expected ':'")

    // SOPORTE SECCIÓN 5.3: Operadores de relación en parámetros
    let relationshipKind: string | undefined
    let isNavigable: boolean | undefined
    if (
      context.match(
        TokenType.OP_INHERIT,
        TokenType.OP_IMPLEMENT,
        TokenType.OP_COMP,
        TokenType.OP_AGREG,
        TokenType.OP_COMP_NON_NAVIGABLE,
        TokenType.OP_AGREG_NON_NAVIGABLE,
        TokenType.OP_USE,
        TokenType.OP_ASSOC,
        TokenType.OP_ASSOC_BIDIR,
        TokenType.GT,
      )
    ) {
      const kindToken = context.prev()
      relationshipKind = kindToken.value
      isNavigable =
        kindToken.type !== TokenType.OP_COMP_NON_NAVIGABLE &&
        kindToken.type !== TokenType.OP_AGREG_NON_NAVIGABLE
    }

    const modifiers = ModifierRule.parse(context)

    const typeAnnotation = this.typeRule.parse(context)
    let multiplicity: string | undefined

    if (context.check(TokenType.LBRACKET)) {
      multiplicity = ''
      context.advance()
      while (!context.check(TokenType.RBRACKET) && !context.isAtEnd()) {
        multiplicity += context.advance().value
      }
      context.consume(TokenType.RBRACKET, "Expected ']'")
    }

    const constraints: ConstraintNode[] = []
    if (context.check(TokenType.LBRACE)) {
      constraints.push(ConstraintRule.parseInline(context))
    }

    return ASTFactory.createParameter(
      paramName.value,
      typeAnnotation,
      paramName.line,
      paramName.column,
      {
        relationshipKind,
        isNavigable,
        targetModifiers: modifiers,
        multiplicity,
        constraints: constraints.length > 0 ? constraints : undefined,
      },
    )
  }
}
