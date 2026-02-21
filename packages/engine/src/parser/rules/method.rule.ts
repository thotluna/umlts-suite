import type { Token } from '../../syntax/token.types'
import { TokenType } from '../../syntax/token.types'
import { ASTNodeType, type MethodNode, type TypeNode, type Modifiers } from '../../syntax/nodes'
import type { ParserContext } from '../parser.context'
import { ParameterRule } from './parameter.rule'
import { MemberSuffixRule, type MemberSuffix } from './member-suffix.rule'

export class MethodRule {
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

    let suffix: MemberSuffix | undefined
    if (context.check(TokenType.COLON)) {
      suffix = MemberSuffixRule.parse(context)
    }

    return {
      type: ASTNodeType.METHOD,
      name: name.value,
      visibility,
      modifiers,
      parameters,
      returnType: suffix?.typeAnnotation ?? this.createVoidType(name),
      returnMultiplicity: suffix?.multiplicity,
      returnRelationshipKind: suffix?.relationshipKind,
      isNavigable: suffix?.isNavigable,
      constraints: suffix?.constraints,
      returnTargetModifiers: suffix?.targetModifiers ?? this.createDefaultModifiers(),
      docs: context.consumePendingDocs(),
      line: name.line,
      column: name.column,
    }
  }

  private createVoidType(name: Token): TypeNode {
    return {
      type: ASTNodeType.TYPE,
      kind: 'simple',
      name: 'void',
      raw: 'void',
      line: name.line,
      column: name.column,
    }
  }

  private createDefaultModifiers(): Modifiers {
    return {
      isAbstract: false,
      isStatic: false,
      isActive: false,
      isLeaf: false,
      isFinal: false,
      isRoot: false,
    }
  }
}
