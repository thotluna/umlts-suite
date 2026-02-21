import type { ParserContext } from '../../parser.context'
import type { TypeNode } from '../../../syntax/nodes'
import type { TypeRule } from '../type.rule'

export interface ITypeStrategy {
  canHandle(context: ParserContext): boolean
}

export interface IPrimaryTypeProvider extends ITypeStrategy {
  parse(context: ParserContext, typeRule: TypeRule): TypeNode
}

export interface ITypeModifierProvider extends ITypeStrategy {
  apply(context: ParserContext, baseNode: TypeNode, typeRule: TypeRule): TypeNode
}
