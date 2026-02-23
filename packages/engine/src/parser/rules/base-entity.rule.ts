import { TokenType } from '../../syntax/token.types'
import { ASTNodeType } from '../../syntax/nodes'
import type { Token } from '../../syntax/token.types'
import type { MemberNode, StatementNode, Modifiers } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import type { StatementRule, Orchestrator } from '../rule.types'
import { RelationshipHeaderRule } from './relationship-header.rule'
import { MemberRule } from './member.rule'
import { ASTFactory } from '../factory/ast.factory'

/**
 * BaseEntityRule: Clase base abstracta para entidades como Clases e Interfaces.
 */
export abstract class BaseEntityRule implements StatementRule {
  private readonly relationshipHeaderRule = new RelationshipHeaderRule()
  private readonly memberRule = new MemberRule()

  public abstract canHandle(context: IParserHub): boolean
  public abstract parse(context: IParserHub, orchestrator: Orchestrator): StatementNode[]

  /**
   * Método común para completar el parseo una vez que la keyword y los modificadores han sido procesados
   * por la clase específica.
   */
  protected completeEntityParsing(
    context: IParserHub,
    orchestrator: Orchestrator,
    type: ASTNodeType.CLASS | ASTNodeType.INTERFACE,
    keywordToken: Token,
    modifiers: Modifiers,
  ): StatementNode[] {
    const nameToken = context.softConsume(TokenType.IDENTIFIER, 'Entity name expected')

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
          const member = this.memberRule.parse(context, orchestrator)
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
      ASTFactory.createEntity(
        type,
        nameToken.value,
        modifiers,
        relationships,
        body,
        keywordToken.line,
        keywordToken.column,
        docs,
        typeParameters,
      ),
    ]
  }
}
