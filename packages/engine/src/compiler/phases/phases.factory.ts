import { LexerPhase } from '@engine/compiler/phases/lexer.phase'
import { ParserPhase } from '@engine/compiler/phases/parser.phase'
import { SemanticPhase } from '@engine/compiler/phases/semantic.phases'
import type { CompilerPhase } from '@engine/compiler/phases/types'

export class PhasesFactory {
  public getPhases(): CompilerPhase[] {
    return [new LexerPhase(), new ParserPhase(), new SemanticPhase()]
  }
}
