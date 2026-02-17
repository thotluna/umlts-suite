import type { Token } from '../../syntax/token.types'
import { TokenType } from '../../syntax/token.types'
import { ASTNodeType, type MethodNode, type TypeNode, type Modifiers } from '../../syntax/nodes'
import type { ParserContext } from '../parser.context'
import { TypeRule } from './type.rule'
import { ParameterRule } from './parameter.rule'

export class MethodRule {
  private readonly typeRule = new TypeRule()
  private readonly parameterRule = new ParameterRule()

  public parse(
    context: ParserContext,
    name: Token,
    visibility: string,
    modifiers: Modifiers,
  ): MethodNode {
    context.consume(TokenType.LPAREN, '')
    const parameters = []

    if (!context.check(TokenType.RPAREN)) {
      do {
        parameters.push(this.parameterRule.parse(context))
      } while (context.match(TokenType.COMMA))
    }

    context.consume(TokenType.RPAREN, "Expected ')' after parameters")

    let returnType: TypeNode = {
      type: ASTNodeType.TYPE,
      kind: 'simple',
      name: 'void',
      raw: 'void',
      line: name.line,
      column: name.column,
    }
    let returnRelationshipKind: string | undefined

    if (context.match(TokenType.COLON)) {
      // SOPORTE SECCIÓN 5.3: Operadores de relación en tipo de retorno
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
        returnRelationshipKind = context.prev().value
      }

      const returnModifiers = {
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
          returnModifiers.isAbstract = true
          found = true
        }
        if (context.match(TokenType.MOD_STATIC, TokenType.KW_STATIC)) {
          returnModifiers.isStatic = true
          found = true
        }
        if (context.match(TokenType.MOD_ACTIVE, TokenType.KW_ACTIVE)) {
          returnModifiers.isActive = true
          found = true
        }
        if (context.match(TokenType.MOD_LEAF, TokenType.KW_LEAF)) {
          returnModifiers.isLeaf = true
          found = true
        }
        if (context.match(TokenType.KW_FINAL)) {
          returnModifiers.isFinal = true
          found = true
        }
        if (context.match(TokenType.MOD_ROOT, TokenType.KW_ROOT)) {
          returnModifiers.isRoot = true
          found = true
        }
      }

      returnType = this.typeRule.parse(context)

      return {
        type: ASTNodeType.METHOD,
        name: name.value,
        visibility,
        modifiers,
        parameters,
        returnType,
        returnRelationshipKind,
        returnTargetModifiers: returnModifiers,
        docs: context.consumePendingDocs(),
        line: name.line,
        column: name.column,
      }
    }

    return {
      type: ASTNodeType.METHOD,
      name: name.value,
      visibility,
      modifiers,
      parameters,
      returnType,
      returnRelationshipKind,
      returnTargetModifiers: {
        isAbstract: false,
        isStatic: false,
        isActive: false,
        isLeaf: false,
        isFinal: false,
        isRoot: false,
      },
      docs: context.consumePendingDocs(),
      line: name.line,
      column: name.column,
    }
  }
}
