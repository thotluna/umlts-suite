import type { IParserHub } from './parser.hub'
import type { MemberNode } from '../../syntax/nodes'
import { Orchestrator } from '../rule.types'

export interface IMemberProvider {
  canHandle(context: IParserHub): boolean
  parse(context: IParserHub, orchestrator: Orchestrator): MemberNode | null
}
