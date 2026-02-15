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

  public parse(context: ParserContext, _orchestrator: Orchestrator): StatementNode | null {
    const pos = context.getPosition()
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

    if (!context.match(TokenType.KW_CLASS, TokenType.KW_INTERFACE, TokenType.KW_ENUM)) {
      context.rollback(pos)
      return null
    }

    // Support modifiers after keyword (e.g. class * MyClass)
    found = true
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

    const { isAbstract, isStatic, isActive, isLeaf, isFinal, isRoot } = modifiers

    const token = context.prev()
    let type: EntityType = ASTNodeType.CLASS
    if (token.type === TokenType.KW_INTERFACE) type = ASTNodeType.INTERFACE
    if (token.type === TokenType.KW_ENUM) type = ASTNodeType.ENUM

    const nameToken = context.consume(TokenType.IDENTIFIER, 'Entity name expected')

    // CHECK FOR ASSOCIATION CLASS: class C <> (A[m], B[n])
    if (type === ASTNodeType.CLASS && context.match(TokenType.OP_ASSOC_BIDIR)) {
      context.consume(TokenType.LPAREN, "Expected '(' after '<>' in association class")
      const participants: AssociationClassNode['participants'] = []
      do {
        const pName = context.consume(TokenType.IDENTIFIER, 'Expected participant name').value

        // 1. Multiplicidad: [1] o [0..*]
        let pMultiplicity: string | undefined
        if (context.match(TokenType.LBRACKET)) {
          pMultiplicity = ''
          while (!context.check(TokenType.RBRACKET) && !context.isAtEnd()) {
            pMultiplicity += context.advance().value
          }
          context.consume(TokenType.RBRACKET, "Expected ']'")
        }

        // 2. Relaciones anidadas: >> E
        // Pasamos null como multiplicity 'from' porque ya lo capturamos arriba si fuera necesario asociarlo
        // En este contexto, pMultiplicity es del participante en la asociación principal (<>),
        // no necesariamente del inicio de la cadena de herencia, pero visualmente está pegado al identificador.
        const pRelationships = this.relationshipHeaderRule.parse(context)

        participants.push({
          name: pName,
          multiplicity: pMultiplicity,
          relationships: pRelationships,
        })
      } while (context.match(TokenType.COMMA))

      context.consume(TokenType.RPAREN, "Expected ')' after participants")

      // Parse body if present
      let body: MemberNode[] | undefined
      if (context.match(TokenType.LBRACE)) {
        body = []
        while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
          const member = this.memberRule.parse(context)
          if (member != null) body.push(member)
        }
        context.consume(TokenType.RBRACE, "Expected '}'")
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
        const param = context.consume(TokenType.IDENTIFIER, 'Type parameter name expected')
        typeParameters.push(param.value)
      } while (context.match(TokenType.COMMA))
      context.consume(TokenType.GT, "Expected '>' after type parameters")
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
            const commentToken = context.consume(TokenType.COMMENT, '')
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
            context.advance()
          }
        } else {
          const member = this.memberRule.parse(context)
          if (member != null) body.push(member)
        }
      }
      context.consume(TokenType.RBRACE, "Expected '}'")
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
