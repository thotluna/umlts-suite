import type { IParserHub } from './parser.hub'
import type { MemberNode } from '../../syntax/nodes'

export interface IMemberProvider {
  canHandle(context: IParserHub): boolean
  parse(context: IParserHub): MemberNode | null
}
