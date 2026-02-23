import { TokenType } from '@engine/syntax/token.types'
import { ASTNodeType } from '@engine/syntax/nodes'
import type { MemberNode, StatementNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { StatementRule, Orchestrator } from '@engine/parser/rule.types'
import { ModifierRule } from '@engine/parser/rules/modifier.rule'

import { ASTFactory } from '@engine/parser/factory/ast.factory'

/**
 * EnumRule: Regla especializada para el parseo de enumeraciones.
 * Soporta tanto la sintaxis en línea como de bloque.
 */
export class EnumRule implements StatementRule {
  public canHandle(context: IParserHub): boolean {
    const skip = ModifierRule.countModifiers(context)
    return context.lookahead(skip).type === TokenType.KW_ENUM
  }

  public parse(context: IParserHub, _orchestrator: Orchestrator): StatementNode[] {
    const pos = context.getPosition()
    let modifiers = ModifierRule.parse(context)

    if (!context.match(TokenType.KW_ENUM)) {
      context.rollback(pos)
      return []
    }
    const keywordToken = context.prev()

    // Soporte para modificadores después de la palabra clave (ej: enum * MyEnum)
    modifiers = ModifierRule.parse(context, modifiers)

    const nameToken = context.softConsume(TokenType.IDENTIFIER, 'Enum name expected')
    const docs = context.consumePendingDocs()

    // 1. Soporte para enums en línea: enum UserRole(ADMIN, EDITOR, VIEWER)
    if (context.match(TokenType.LPAREN)) {
      const body = this.parseInlineBody(context)
      return [
        ASTFactory.createEntity(
          ASTNodeType.ENUM,
          nameToken.value,
          modifiers,
          [],
          body,
          keywordToken.line,
          keywordToken.column,
          docs,
        ),
      ]
    }

    // 2. Soporte para enums de bloque: enum Color { RED, GREEN }
    let body: MemberNode[] | undefined
    if (context.match(TokenType.LBRACE)) {
      body = []
      while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
        const member = this.parseEnumMember(context)
        if (member) {
          body.push(member)
        } else {
          context.addError('Unrecognized literal in enum', context.peek())
          context.advance()
        }
      }
      context.softConsume(TokenType.RBRACE, "Expected '}'")
    }

    return [
      ASTFactory.createEntity(
        ASTNodeType.ENUM,
        nameToken.value,
        modifiers,
        [],
        body,
        keywordToken.line,
        keywordToken.column,
        docs,
      ),
    ]
  }

  private parseInlineBody(context: IParserHub): MemberNode[] {
    const body: MemberNode[] = []
    while (!context.check(TokenType.RPAREN) && !context.isAtEnd()) {
      const next = context.peek()
      if (next.type === TokenType.IDENTIFIER || next.type.startsWith('KW_')) {
        const literalToken = context.advance()
        body.push(this.createEnumLiteral(literalToken))
        context.match(TokenType.COMMA, TokenType.PIPE)
      } else {
        context.advance()
      }
    }
    context.consume(TokenType.RPAREN, "Expected ')' after enum literals")
    return body
  }

  private parseEnumMember(context: IParserHub): MemberNode | null {
    if (context.match(TokenType.DOC_COMMENT)) {
      context.setPendingDocs(context.prev().value)
      return null
    }

    if (context.check(TokenType.COMMENT)) {
      const token = context.advance()
      return ASTFactory.createComment(token.value, token.line, token.column)
    }

    const next = context.peek()
    if (next.type === TokenType.IDENTIFIER || next.type.startsWith('KW_')) {
      const literalToken = context.advance()
      const member = this.createEnumLiteral(literalToken)
      member.docs = context.consumePendingDocs()
      context.match(TokenType.COMMA)
      return member
    }

    return null
  }

  private createEnumLiteral(token: { value: string; line: number; column: number }): MemberNode {
    return ASTFactory.createAttribute(
      token.value,
      'public',
      ASTFactory.createType('Object', 'simple', 'Object', token.line, token.column),
      {
        isStatic: true,
        isLeaf: false,
        isFinal: false,
      },
      token.line,
      token.column,
    )
  }
}
