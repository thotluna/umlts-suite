import type { ParserContext } from '../../parser.context'
import type { MemberNode } from '../../../syntax/nodes'

export interface IMemberProvider {
  canHandle(context: ParserContext): boolean
  parse(context: ParserContext): MemberNode | null
}
