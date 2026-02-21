import { TokenType } from '../../syntax/token.types'
import {
  ASTNodeType,
  type EntityNode,
  type StatementNode,
  type MemberNode,
  type ConstraintNode,
  type RelationshipHeaderNode,
} from '../../syntax/nodes'
import type { IParserHub } from '../parser.context'
import type { StatementRule, IOrchestrator } from '../rule.types'
import { ModifierRule } from './modifier.rule'
import { MemberRule } from './member.rule'
import { RelationshipHeaderRule } from './relationship-header.rule'

export class EntityRule implements StatementRule {
  private readonly memberRule = new MemberRule()
  private readonly relationshipHeaderRule = new RelationshipHeaderRule()

  public canStart(context: IParserHub): boolean {
    return context.checkAny(
      TokenType.KW_CLASS,
      TokenType.KW_INTERFACE,
      TokenType.KW_ENUM,
      TokenType.KW_DATATYPE,
      TokenType.KW_ACTOR,
      TokenType.KW_USECASE,
      TokenType.KW_ENTITY,
      TokenType.KW_COMPONENT,
      TokenType.KW_NODE,
      TokenType.KW_ARTIFACT,
      TokenType.KW_STATE,
      TokenType.KW_SIGNAL,
      TokenType.KW_EXCEPTION,
      TokenType.KW_ABSTRACT,
      TokenType.MOD_ABSTRACT,
      TokenType.KW_STATIC,
      TokenType.MOD_STATIC,
      TokenType.KW_ACTIVE,
      TokenType.MOD_ACTIVE,
      TokenType.KW_LEAF,
      TokenType.MOD_LEAF,
      TokenType.KW_FINAL,
      TokenType.KW_ROOT,
      TokenType.MOD_ROOT,
    )
  }

  public parse(context: IParserHub, _orchestrator: IOrchestrator): StatementNode[] {
    const docs = context.consumePendingDocs()
    const modifiers = ModifierRule.parse(context)

    const token = context.peek()
    let type = token.type as string

    if (
      context.match(
        TokenType.KW_CLASS,
        TokenType.KW_INTERFACE,
        TokenType.KW_ENUM,
        TokenType.KW_DATATYPE,
        TokenType.KW_ACTOR,
        TokenType.KW_USECASE,
        TokenType.KW_ENTITY,
        TokenType.KW_COMPONENT,
        TokenType.KW_NODE,
        TokenType.KW_ARTIFACT,
        TokenType.KW_STATE,
        TokenType.KW_SIGNAL,
        TokenType.KW_EXCEPTION,
      )
    ) {
      type = context.prev().value
    } else {
      // Si no hay keyword de tipo, asumimos 'class' si hay modificadores
      type = 'class'
    }

    const nameToken = context.softConsume(
      TokenType.IDENTIFIER,
      `Se esperaba un nombre para el elemento de tipo ${type}`,
    )

    // Opcionalmente consumir argumentos de tipo genérico: Class<T, K>
    let typeParameters: string[] | undefined
    if (context.match(TokenType.LT)) {
      typeParameters = []
      while (!context.check(TokenType.GT) && !context.isAtEnd()) {
        typeParameters.push(context.consume(TokenType.IDENTIFIER, 'Expected type parameter name').value)
        if (context.match(TokenType.COMMA)) continue
      }
      context.consume(TokenType.GT, "Se esperaba '>'")
    }

    // Opcionalmente consumir relaciones (>> Interface, >I Base)
    const relationships = this.relationshipHeaderRule.parse(context)

    const body: MemberNode[] = []
    if (context.match(TokenType.LBRACE)) {
      while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
        const startPos = context.getPosition()

        // 1. Documentación
        if (context.match(TokenType.DOC_COMMENT)) {
          context.setPendingDocs(context.prev().value)
          continue
        }

        // 2. Miembros estructurales o de comportamiento
        const member = this.memberRule.parse(context)
        if (member) {
          body.push(member)
        } else {
          // Si ninguna regla consumió y no estamos al final, registramos error y saltamos token
          if (context.getPosition() === startPos) {
            context.addError(`Unexpected token '${context.peek().value}' inside ${type}`, context.peek())
            context.advance()
          }
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
        line: token.line,
        column: token.column,
      } as EntityNode,
    ]
  }
}
