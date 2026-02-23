import { TokenType } from '../../syntax/token.types'
import { ASTNodeType } from '../../syntax/nodes'
import type { MemberNode, StatementNode } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import type { StatementRule, Orchestrator } from '../rule.types'
import { ModifierRule } from './modifier.rule'

import { ASTFactory } from '../factory/ast.factory'

/**
 * EnumRule: Regla especializada para el parseo de enumeraciones.
 * Soporta tanto la sintaxis en línea como de bloque.
 */
export class EnumRule implements StatementRule {
  public canHandle(context: IParserHub): boolean {
    const pos = context.getPosition()
    try {
      while (
        context.checkAny(
          TokenType.MOD_STATIC,
          TokenType.KW_STATIC,
          TokenType.MOD_LEAF,
          TokenType.KW_LEAF,
          TokenType.KW_FINAL,
          TokenType.MOD_ABSTRACT,
          TokenType.KW_ABSTRACT,
          TokenType.MOD_ACTIVE,
          TokenType.KW_ACTIVE,
          TokenType.MOD_ROOT,
          TokenType.KW_ROOT,
        )
      ) {
        context.advance()
      }
      return context.check(TokenType.KW_ENUM)
    } finally {
      context.rollback(pos)
    }
  }

  public parse(context: IParserHub, _orchestrator: Orchestrator): StatementNode[] {
    const pos = context.getPosition()
    const modifiers = ModifierRule.parse(context)

    if (!context.match(TokenType.KW_ENUM)) {
      context.rollback(pos)
      return []
    }
    const keywordToken = context.prev()

    // Soporte para modificadores después de la palabra clave (ej: enum * MyEnum)
    const postModifiers = ModifierRule.parse(context)
    modifiers.isAbstract = modifiers.isAbstract || postModifiers.isAbstract
    modifiers.isStatic = modifiers.isStatic || postModifiers.isStatic
    modifiers.isActive = modifiers.isActive || postModifiers.isActive
    modifiers.isLeaf = modifiers.isLeaf || postModifiers.isLeaf
    modifiers.isFinal = modifiers.isFinal || postModifiers.isFinal
    modifiers.isRoot = modifiers.isRoot || postModifiers.isRoot

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
