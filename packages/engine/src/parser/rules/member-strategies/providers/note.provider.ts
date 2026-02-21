import { NoteRule } from '../../note.rule'
import type { MemberNode } from '../../../../syntax/nodes'
import type { IParserHub } from '../../parser.context'
import type { IMemberProvider } from '../member-strategy.interface'
import type { IOrchestrator } from '../../../../parser/rule.types'

export class NoteMemberProvider implements IMemberProvider {
  private readonly noteRule = new NoteRule()

  canHandle(context: IParserHub): boolean {
    return this.noteRule.canStart(context)
  }

  parse(context: IParserHub): MemberNode | null {
    const nodes = this.noteRule.parse(context, null as unknown as IOrchestrator)
    return nodes.length > 0 ? (nodes[0] as MemberNode) : null
  }
}
