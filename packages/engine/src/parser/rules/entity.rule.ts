import { TokenType } from '../../lexer/token.types'
import type { EntityNode, MemberNode, EntityType } from '../ast/nodes'
import { ASTNodeType } from '../ast/nodes'
import type { ParserContext } from '../parser.context'
import type { StatementRule } from '../rule.types'
import { RelationshipHeaderRule } from './relationship-header.rule'
import { MemberRule } from './member.rule'

export class EntityRule implements StatementRule {
  private readonly relationshipHeaderRule = new RelationshipHeaderRule()
  private readonly memberRule = new MemberRule()

  public parse(context: ParserContext): EntityNode | null {
    const pos = context.getPosition()
    let isActive = context.match(TokenType.KW_ACTIVE, TokenType.MOD_ACTIVE)
    let isAbstract = context.match(TokenType.KW_ABSTRACT, TokenType.MOD_ABSTRACT)
    let isStatic = context.match(TokenType.KW_STATIC, TokenType.MOD_STATIC)

    if (!context.match(TokenType.KW_CLASS, TokenType.KW_INTERFACE, TokenType.KW_ENUM)) {
      context.rollback(pos)
      return null
    }

    // Support modifiers after keyword (e.g. class * MyClass or class $ MyClass)
    if (!isActive) isActive = context.match(TokenType.KW_ACTIVE, TokenType.MOD_ACTIVE)
    if (!isAbstract) isAbstract = context.match(TokenType.KW_ABSTRACT, TokenType.MOD_ABSTRACT)
    if (!isStatic) isStatic = context.match(TokenType.KW_STATIC, TokenType.MOD_STATIC)

    const token = context.prev()
    let type: EntityType = ASTNodeType.CLASS
    if (token.type === TokenType.KW_INTERFACE) type = ASTNodeType.INTERFACE
    if (token.type === TokenType.KW_ENUM) type = ASTNodeType.ENUM

    const nameToken = context.consume(TokenType.IDENTIFIER, 'Se esperaba el nombre de la entidad')

    const docs = context.consumePendingDocs()

    // Soporte para genéricos: <T, K>
    let typeParameters: string[] | undefined
    if (context.match(TokenType.LT)) {
      typeParameters = []
      do {
        const param = context.consume(
          TokenType.IDENTIFIER,
          'Se esperaba el nombre del parámetro de tipo',
        )
        typeParameters.push(param.value)
      } while (context.match(TokenType.COMMA))
      context.consume(TokenType.GT, "Se esperaba '>' después de los parámetros de tipo")
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
            const literalToken = context.consume(
              TokenType.IDENTIFIER,
              'Se esperaba el nombre del literal del enum',
            )
            body.push({
              type: ASTNodeType.ATTRIBUTE,
              name: literalToken.value,
              visibility: 'public',
              isStatic: true,
              typeAnnotation: {
                type: ASTNodeType.TYPE,
                kind: 'simple',
                name: 'any',
                raw: 'any',
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
      context.consume(TokenType.RBRACE, "Se esperaba '}'")
    }

    return {
      type,
      name: nameToken.value,
      isAbstract,
      isStatic,
      isActive,
      typeParameters,
      docs,
      relationships,
      body,
      line: token.line,
      column: token.column,
    }
  }
}
