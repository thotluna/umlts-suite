import type { IParserHub } from '../../parser.context'
import type { TypeNode } from '../../../syntax/nodes'
import type { TypeRule } from '../type.rule'

export interface ITypeStrategy {
  canHandle(context: IParserHub): boolean
}

export interface IPrimaryTypeProvider extends ITypeStrategy {
  parse(context: IParserHub, typeRule: TypeRule): TypeNode
}

export interface ITypeModifierProvider extends ITypeStrategy {
  apply(context: IParserHub, baseNode: TypeNode, typeRule: TypeRule): TypeNode
}
