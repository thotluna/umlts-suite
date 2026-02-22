import { TokenType } from '../../syntax/token.types'
import { ASTNodeType } from '../../syntax/nodes'
import type { MemberNode, StatementNode } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import type { StatementRule, Orchestrator } from '../rule.types'
import { RelationshipHeaderRule } from './relationship-header.rule'
import { MemberRule } from './member.rule'
import { ModifierRule } from './modifier.rule'

/**
 * EntityRule: Regla para parsear Clases e Interfaces.
 */
export class EntityRule implements StatementRule {
  private readonly relationshipHeaderRule = new RelationshipHeaderRule()
  private readonly memberRule = new MemberRule()

  public canStart(context: IParserHub): boolean {
    return context.checkAny(
      TokenType.KW_CLASS,
      TokenType.KW_INTERFACE,
      TokenType.MOD_ABSTRACT,
      TokenType.KW_ABSTRACT,
      TokenType.MOD_STATIC,
      TokenType.KW_STATIC,
      TokenType.MOD_ACTIVE,
      TokenType.KW_ACTIVE,
      TokenType.MOD_LEAF,
      TokenType.KW_LEAF,
      TokenType.KW_FINAL,
      TokenType.MOD_ROOT,
      TokenType.KW_ROOT,
    )
  }

  public parse(context: IParserHub, _orchestrator: Orchestrator): StatementNode[] {
    const pos = context.getPosition()
    const modifiers = ModifierRule.parse(context)

    if (!context.match(TokenType.KW_CLASS, TokenType.KW_INTERFACE)) {
      context.rollback(pos)
      return []
    }
    const keywordToken = context.prev()

    // Soporte para modificadores después de la palabra clave (ej: class * MyClass)
    const postModifiers = ModifierRule.parse(context)
    modifiers.isAbstract = modifiers.isAbstract || postModifiers.isAbstract
    modifiers.isStatic = modifiers.isStatic || postModifiers.isStatic
    modifiers.isActive = modifiers.isActive || postModifiers.isActive
    modifiers.isLeaf = modifiers.isLeaf || postModifiers.isLeaf
    modifiers.isFinal = modifiers.isFinal || postModifiers.isFinal
    modifiers.isRoot = modifiers.isRoot || postModifiers.isRoot

    const nameToken = context.softConsume(TokenType.IDENTIFIER, 'Entity name expected')
    const type =
      keywordToken.type === TokenType.KW_CLASS ? ASTNodeType.CLASS : ASTNodeType.INTERFACE

    const docs = context.consumePendingDocs()

    // Soporte para genéricos: <T, K>
    let typeParameters: string[] | undefined
    if (context.match(TokenType.LT)) {
      typeParameters = []
      do {
        const paramToken = context.softConsume(TokenType.IDENTIFIER, 'Type parameter name expected')
        typeParameters.push(paramToken.value)
      } while (context.match(TokenType.COMMA))
      context.softConsume(TokenType.GT, "Expected '>' after type parameters")
    }

    // Parse relationship list in header
    const relationships = this.relationshipHeaderRule.parse(context)

    // Parse body members
    let body: MemberNode[] | undefined
    if (context.match(TokenType.LBRACE)) {
      body = []
      while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
        try {
          const member = this.memberRule.parse(context)
          if (member != null) {
            body.push(member)
          } else {
            context.addError('Unrecognized member in entity body', context.peek())
            context.advance()
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Error parsing member'
          context.addError(msg)
          context.advance()
        }
      }
      context.softConsume(TokenType.RBRACE, "Expected '}'")
    }

    return [
      {
        type,
        name: nameToken.value,
        modifiers,
        typeParameters,
        docs,
        relationships,
        body,
        line: keywordToken.line,
        column: keywordToken.column,
      },
    ]
  }
}
