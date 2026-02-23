import type { Token } from '../../syntax/token.types'
import { TokenType } from '../../syntax/token.types'
import { type MethodNode, type Modifiers } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import { ParameterRule } from './parameter.rule'
import { MemberSuffixRule, type MemberSuffix } from './member-suffix.rule'
import { ASTFactory } from '../factory/ast.factory'
import type { Orchestrator } from '../rule.types'

export class MethodRule {
  private readonly parameterRule = new ParameterRule()

  public parse(
    context: IParserHub,
    name: Token,
    visibility: string,
    modifiers: Modifiers,
    _orchestrator: Orchestrator,
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

    return ASTFactory.createMethod(
      name.value,
      visibility,
      suffix?.typeAnnotation ??
        ASTFactory.createType('void', 'simple', 'void', name.line, name.column),
      modifiers,
      parameters,
      name.line,
      name.column,
      {
        returnMultiplicity: suffix?.multiplicity,
        returnRelationshipKind: suffix?.relationshipKind,
        isNavigable: suffix?.isNavigable,
        constraints: suffix?.constraints,
        returnTargetModifiers: suffix?.targetModifiers ?? this.createDefaultModifiers(),
        docs: context.consumePendingDocs(),
      },
    )
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
