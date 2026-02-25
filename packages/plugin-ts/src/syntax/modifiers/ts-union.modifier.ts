import {
  TokenType,
  ITypeModifierProvider,
  IParserHub,
  TypeRule,
  TypeNode,
  ASTFactory,
} from '@umlts/engine'

/**
 * TSUnionTypeModifier: Handles TypeScript union types (e.g. A | B).
 * Maps them to the UML 'xor' type kind.
 */
export class TSUnionTypeModifier implements ITypeModifierProvider {
  public canHandle(context: IParserHub): boolean {
    return context.check(TokenType.PIPE)
  }

  public apply(context: IParserHub, baseNode: TypeNode, typeRule: TypeRule): TypeNode {
    context.consume(TokenType.PIPE, '')
    const rightType = typeRule.parse(context)

    const args: TypeNode[] = []

    // Flatten nested unions if they exist
    if (baseNode.kind === 'xor') {
      args.push(...(baseNode.arguments || []))
    } else {
      args.push(baseNode)
    }

    if (rightType.kind === 'xor') {
      args.push(...(rightType.arguments || []))
    } else {
      args.push(rightType)
    }

    const raw = `${baseNode.raw} | ${rightType.raw}`

    return ASTFactory.createType('xor', 'xor', raw, baseNode.line, baseNode.column, {
      arguments: args,
    })
  }
}
