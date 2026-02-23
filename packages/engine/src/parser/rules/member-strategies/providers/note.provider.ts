import { NoteRule } from '@engine/parser/rules/note.rule'
import type { MemberNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { IMemberProvider } from '@engine/parser/core/member-provider.interface'
import type { Orchestrator } from '@engine/parser/rule.types'

export class NoteMemberProvider implements IMemberProvider {
  private readonly noteRule = new NoteRule()

  canHandle(context: IParserHub): boolean {
    return this.noteRule.canHandle(context)
  }

  parse(context: IParserHub, orchestrator: Orchestrator): MemberNode | null {
    const nodes = this.noteRule.parse(context, orchestrator)
    return nodes.length > 0 ? (nodes[0] as MemberNode) : null
  }
}
