import { TokenType } from '../../lexer/token.types'
import { ASTNodeType } from '../ast/nodes'
import type { MemberNode, EntityType, AssociationClassNode, StatementNode } from '../ast/nodes'
import type { ParserContext } from '../parser.context'
import type { StatementRule, Orchestrator } from '../rule.types'
import { RelationshipHeaderRule } from './relationship-header.rule'
import { MemberRule } from './member.rule'

export class EntityRule implements StatementRule {
  private readonly relationshipHeaderRule = new RelationshipHeaderRule()
  private readonly memberRule = new MemberRule()

  public canStart(context: ParserContext): boolean {
    return context.checkAny(
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

  public parse(context: ParserContext, _orchestrator: Orchestrator): StatementNode | null {
    const pos = context.getPosition()
    const modifiers = context.consumeModifiers()

    if (!context.match(TokenType.KW_CLASS, TokenType.KW_INTERFACE, TokenType.KW_ENUM)) {
      context.rollback(pos)
      return null
    }

    // Support modifiers after keyword (e.g. class * MyClass)
    // Combinamos con los previos si existen
    const postModifiers = context.consumeModifiers()
    modifiers.isAbstract = modifiers.isAbstract || postModifiers.isAbstract
    modifiers.isStatic = modifiers.isStatic || postModifiers.isStatic
    modifiers.isActive = modifiers.isActive || postModifiers.isActive
    modifiers.isLeaf = modifiers.isLeaf || postModifiers.isLeaf
    modifiers.isFinal = modifiers.isFinal || postModifiers.isFinal
    modifiers.isRoot = modifiers.isRoot || postModifiers.isRoot

    const { isAbstract, isStatic, isActive, isLeaf, isFinal, isRoot } = modifiers

    const token = context.prev()
    let type: EntityType = ASTNodeType.CLASS
    if (token.type === TokenType.KW_INTERFACE) type = ASTNodeType.INTERFACE
    if (token.type === TokenType.KW_ENUM) type = ASTNodeType.ENUM

    const nameToken = context.softConsume(TokenType.IDENTIFIER, 'Entity name expected')

    // CHECK FOR ASSOCIATION CLASS: class C <> (A[m], B[n])
    if (type === ASTNodeType.CLASS && context.match(TokenType.OP_ASSOC_BIDIR)) {
      context.softConsume(TokenType.LPAREN, "Expected '(' after '<>' in association class")
      const participants: AssociationClassNode['participants'] = []
      do {
        const pNameToken = context.softConsume(TokenType.IDENTIFIER, 'Expected participant name')

        // 1. Multiplicidad: [1] o [0..*]
        let pMultiplicity: string | undefined
        if (context.match(TokenType.LBRACKET)) {
          pMultiplicity = ''
          while (!context.check(TokenType.RBRACKET) && !context.isAtEnd()) {
            pMultiplicity += context.advance().value
          }
          context.softConsume(TokenType.RBRACKET, "Expected ']'")
        }

        // 2. Relaciones anidadas: >> E
        const pRelationships = this.relationshipHeaderRule.parse(context)

        participants.push({
          name: pNameToken.value,
          multiplicity: pMultiplicity,
          relationships: pRelationships,
        })
      } while (context.match(TokenType.COMMA))

      context.softConsume(TokenType.RPAREN, "Expected ')' after participants")

      // Parse body if present
      let body: MemberNode[] | undefined
      if (context.match(TokenType.LBRACE)) {
        body = []
        while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
          const member = this.memberRule.parse(context)
          if (member != null) {
            body.push(member)
          } else {
            context.addError('Unrecognized member in association class', context.peek())
            context.advance()
          }
        }
        context.softConsume(TokenType.RBRACE, "Expected '}'")
      }

      return {
        type: ASTNodeType.ASSOCIATION_CLASS,
        name: nameToken.value,
        participants,
        body,
        line: token.line,
        column: token.column,
        docs: context.consumePendingDocs(),
      } as AssociationClassNode
    }

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
        if (type === ASTNodeType.ENUM) {
          // Para enums, los miembros son simples identificadores
          if (context.match(TokenType.DOC_COMMENT)) {
            context.setPendingDocs(context.prev().value)
            continue
          }
          if (context.check(TokenType.COMMENT)) {
            const commentToken = context.advance()
            body.push({
              type: ASTNodeType.COMMENT,
              value: commentToken.value,
              line: commentToken.line,
              column: commentToken.column,
            })
            continue
          }
          if (context.check(TokenType.IDENTIFIER)) {
            const literalToken = context.consume(TokenType.IDENTIFIER, 'Enum literal name expected')
            body.push({
              type: ASTNodeType.ATTRIBUTE,
              name: literalToken.value,
              visibility: 'public',
              isStatic: true,
              isLeaf: false,
              isFinal: false,
              typeAnnotation: {
                type: ASTNodeType.TYPE,
                kind: 'simple',
                name: 'Object',
                raw: 'Object',
                line: literalToken.line,
                column: literalToken.column,
              },
              multiplicity: undefined,
              docs: context.consumePendingDocs(),
              line: literalToken.line,
              column: literalToken.column,
            })
            context.match(TokenType.COMMA)
          } else {
            context.addError('Unrecognized literal in enum', context.peek())
            context.advance()
          }
        } else {
          try {
            const member = this.memberRule.parse(context)
            if (member != null) {
              body.push(member)
            } else {
              context.addError('Unrecognized member in entity body', context.peek())
              context.advance()
            }
          } catch (e: unknown) {
            // Si el parseo de un miembro falla catastróficamente, lo reportamos y seguimos
            const msg = e instanceof Error ? e.message : 'Error parsing member'
            context.addError(msg)
            // Aquí podríamos intentar avanzar hasta un punto seguro de miembro (ej. el próximo ';' o modificador)
            context.advance()
          }
        }
      }
      context.softConsume(TokenType.RBRACE, "Expected '}'")
    }

    return {
      type,
      name: nameToken.value,
      isAbstract,
      isStatic,
      isActive,
      isLeaf,
      isFinal,
      isRoot,
      typeParameters,
      docs,
      relationships,
      body,
      line: token.line,
      column: token.column,
    }
  }
}
