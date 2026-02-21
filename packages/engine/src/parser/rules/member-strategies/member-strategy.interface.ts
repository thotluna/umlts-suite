import type { IParserHub } from '../../parser.context'
import type { MemberNode } from '../../../syntax/nodes'

export interface IMemberProvider {
  canHandle(context: IParserHub): boolean
  parse(context: IParserHub): MemberNode | null
}
