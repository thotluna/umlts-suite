import { TokenType } from '../../syntax/token.types'
import {
  type EntityType,
  ASTNodeType,
  type EntityNode,
  type MemberNode,
  type RelationshipHeaderNode,
} from '../../syntax/nodes'
import type { IParserHub } from '../parser.context'
import type { StatementRule, IOrchestrator, MemberProvider } from '../rule.types'
import { ModifierRule } from './modifier.rule'

/**
 * Parses entities (Class, Interface, Enum) and their members.
 */
export class EntityRule implements StatementRule {
  constructor(private readonly memberProviders: MemberProvider[]) {}

  public canStart(context: IParserHub): boolean {
    return context.check(
      TokenType.KW_CLASS,
      TokenType.KW_INTERFACE,
      TokenType.KW_ENUM,
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

  public parse(context: IParserHub, orchestrator: IOrchestrator): EntityNode[] {
    const modifiers = ModifierRule.parse(context)

    if (
      !context.match(TokenType.KW_CLASS, TokenType.KW_INTERFACE, TokenType.KW_ENUM) &&
      !context.check(TokenType.IDENTIFIER)
    ) {
      context.addError('Expected class, interface, or enum', context.peek())
      return []
    }

    const typeToken = context.prev()
    const type = this.mapType(typeToken.type)

    if (!context.expect(TokenType.IDENTIFIER, 'Expected entity name')) {
      return []
    }

    const name = context.prev().value
    const typeParameters = this.parseTypeParameters(context)
    const relationships = this.parseRelationships(context, orchestrator)

    const node: EntityNode = {
      type,
      name,
      modifiers,
      typeParameters,
      relationships,
      body: undefined,
      line: typeToken.line,
      column: typeToken.column,
    }

    node.body = this.parseBody(context, orchestrator, type)

    return [node]
  }

  private mapType(tokenType: TokenType): EntityType {
    switch (tokenType) {
      case TokenType.KW_INTERFACE:
        return ASTNodeType.INTERFACE
      case TokenType.KW_ENUM:
        return ASTNodeType.ENUM
      default:
        return ASTNodeType.CLASS
    }
  }

  private parseTypeParameters(context: IParserHub): string[] | undefined {
    if (!context.match(TokenType.LT)) return undefined

    const params: string[] = []
    do {
      if (context.expect(TokenType.IDENTIFIER, 'Expected type parameter name')) {
        params.push(context.prev().value)
      }
    } while (context.match(TokenType.COMMA))

    context.expect(TokenType.GT, "Expected '>' after type parameters")
    return params
  }

  private parseRelationships(
    context: IParserHub,
    orchestrator: IOrchestrator,
  ): RelationshipHeaderNode[] {
    const relationships: RelationshipHeaderNode[] = []

    while (
      context.check(
        TokenType.REL_INHERIT,
        TokenType.KW_EXTENDS,
        TokenType.REL_IMPLEMENT,
        TokenType.KW_IMPLEMENTS,
      )
    ) {
      const rels = orchestrator.parseStatement(context)
      rels.forEach((r) => {
        if (r.type === ASTNodeType.RELATIONSHIP) {
          relationships.push(r as unknown as RelationshipHeaderNode)
        }
      })
    }

    return relationships
  }

  private parseBody(
    context: IParserHub,
    orchestrator: IOrchestrator,
    type: string,
  ): MemberNode[] | undefined {
    const members: MemberNode[] = []
    const isEnum = type.toLowerCase() === 'enum' || type.toLowerCase() === 'enumeration'

    if (context.match(TokenType.LBRACE)) {
      while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
        const startPos = context.getPosition()

        if (context.match(TokenType.DOC_COMMENT)) {
          context.setPendingDocs(context.prev().value)
        }

        let handled = false
        // 1. Try specialized member providers first (Attributes, Methods, etc.)
        for (const provider of this.memberProviders) {
          if (provider.canHandle(context)) {
            const member = provider.parse(context, orchestrator)
            if (member) {
              members.push(member)
              handled = true
              break
            }
          }
        }

        // 2. If not handled and it's an enum, it's likely a literal
        if (!handled && isEnum && context.match(TokenType.IDENTIFIER)) {
          const literalName = context.prev().value
          members.push({
            type: ASTNodeType.ATTRIBUTE,
            name: literalName,
            visibility: '+',
            modifiers: { isStatic: true, isReadOnly: true },
            typeAnnotation: {
              type: ASTNodeType.TYPE,
              kind: 'simple',
              raw: type,
              name: type,
              line: context.prev().line,
              column: context.prev().column,
            },
            multiplicity: undefined,
            line: context.prev().line,
            column: context.prev().column,
            docs: context.consumePendingDocs(),
          } as any)
          handled = true

          // Consume optional comma
          context.match(TokenType.COMMA)
        }

        // 3. Fallback: Parse as a general statement inside the block
        if (!handled) {
          const nodes = orchestrator.parseStatement(context)
          if (nodes.length > 0) {
            members.push(...(nodes as MemberNode[]))
            handled = true
          }
        }

        if (!handled && context.getPosition() === startPos) {
          context.addError(`Unexpected member in ${type}: ${context.peek().value}`, context.peek())
          context.advance()
        }
      }
      context.expect(TokenType.RBRACE, "Expected '}' after body")
      return members
    }

    return undefined
  }
}
