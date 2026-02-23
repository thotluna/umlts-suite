import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { TypeNode } from '@engine/syntax/nodes'
import type { TypeRule } from '@engine/parser/rules/type.rule'

export interface ITypeStrategy {
  canHandle(context: IParserHub): boolean
}

export interface IPrimaryTypeProvider extends ITypeStrategy {
  parse(context: IParserHub, typeRule: TypeRule): TypeNode
}

export interface ITypeModifierProvider extends ITypeStrategy {
  apply(context: IParserHub, baseNode: TypeNode, typeRule: TypeRule): TypeNode
}
