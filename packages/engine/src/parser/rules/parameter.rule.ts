import { TokenType } from '../../lexer/token.types'
import { ASTNodeType, type ParameterNode } from '../ast/nodes'
import type { ParserContext } from '../parser.context'
import { TypeRule } from './type.rule'

export class ParameterRule {
  private readonly typeRule = new TypeRule()

  public parse(context: ParserContext): ParameterNode {
    const paramName = context.consume(TokenType.IDENTIFIER, 'Parameter name expected')
    context.consume(TokenType.COLON, "Expected ':'")

    // SOPORTE SECCIÓN 5.3: Operadores de relación en parámetros
    let relationshipKind: string | undefined
    if (
      context.match(
        TokenType.OP_INHERIT,
        TokenType.OP_IMPLEMENT,
        TokenType.OP_COMP,
        TokenType.OP_AGREG,
        TokenType.OP_USE,
        TokenType.OP_ASSOC,
        TokenType.OP_ASSOC_BIDIR,
        TokenType.GT,
      )
    ) {
      relationshipKind = context.prev().value
    }

    const modifiers = {
      isAbstract: false,
      isStatic: false,
      isActive: false,
      isLeaf: false,
      isFinal: false,
      isRoot: false,
    }

    let found = true
    while (found) {
      found = false
      if (context.match(TokenType.MOD_ABSTRACT, TokenType.KW_ABSTRACT)) {
        modifiers.isAbstract = true
        found = true
      }
      if (context.match(TokenType.MOD_STATIC, TokenType.KW_STATIC)) {
        modifiers.isStatic = true
        found = true
      }
      if (context.match(TokenType.MOD_ACTIVE, TokenType.KW_ACTIVE)) {
        modifiers.isActive = true
        found = true
      }
      if (context.match(TokenType.MOD_LEAF, TokenType.KW_LEAF)) {
        modifiers.isLeaf = true
        found = true
      }
      if (context.match(TokenType.KW_FINAL)) {
        modifiers.isFinal = true
        found = true
      }
      if (context.match(TokenType.MOD_ROOT, TokenType.KW_ROOT)) {
        modifiers.isRoot = true
        found = true
      }
    }

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

    return {
      type: ASTNodeType.PARAMETER,
      name: paramName.value,
      typeAnnotation,
      relationshipKind,
      targetModifiers: modifiers,
      multiplicity,
      line: paramName.line,
      column: paramName.column,
    }
  }
}
