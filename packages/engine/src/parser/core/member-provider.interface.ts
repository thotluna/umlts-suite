import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { MemberNode } from '@engine/syntax/nodes'
import { Orchestrator } from '@engine/parser/rule.types'

export interface IMemberProvider {
  canHandle(context: IParserHub): boolean
  parse(context: IParserHub, orchestrator: Orchestrator): MemberNode | null
}
