import { NoteRule } from '../../note.rule'
import type { MemberNode } from '../../../../syntax/nodes'
import type { ParserContext } from '../../../parser.context'
import type { IMemberProvider } from '../member-strategy.interface'
import type { Orchestrator } from '../../../../parser/rule.types'

export class NoteMemberProvider implements IMemberProvider {
  private readonly noteRule = new NoteRule()

  canHandle(context: ParserContext): boolean {
    return this.noteRule.canStart(context)
  }

  parse(context: ParserContext): MemberNode | null {
    const nodes = this.noteRule.parse(context, null as unknown as Orchestrator)
    return nodes.length > 0 ? (nodes[0] as MemberNode) : null
  }
}
