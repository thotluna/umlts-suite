export type { ParseResult } from './generator/types'
import { SemanticPhase } from './compiler/phases/semantic.phases'
import { ParserPhase } from './compiler/phases/parser.phase'
import { LexerPhase } from './compiler/phases/lexer.phase'
import { type CompilerPhase } from './compiler/phases/types'
import { CompilerContext } from './compiler/phases/context'
import type { Token } from './syntax/token.types'
import { LexerFactory } from './lexer/lexer.factory'
import { type ParseResult } from './generator/types'

export * from './generator/ir/models'
export * from './syntax/diagnostic.types'
export * from './syntax/token.types'
export * from './syntax/nodes'

/**
 * Fachada principal del motor ts-uml-engine.
 * Orquesta las fases del compilador en un flujo único con estado.
 */
export class UMLEngine {
  private readonly phases: CompilerPhase[] = [
    new LexerPhase(),
    new ParserPhase(),
    new SemanticPhase(),
  ]

  /**
   * Procesa código fuente UMLTS y devuelve una representación intermedia resuelta.
   *
   * @param source - El código fuente en lenguaje UMLTS.
   * @returns Un objeto con el diagrama y los diagnósticos acumulados.
   */
  public async parse(source: string): Promise<ParseResult> {
    const context = new CompilerContext(source)

    for (const phase of this.phases) {
      await phase.run(context)
      // Si hay errores fatales, abortamos las fases siguientes
      if (context.hasErrors()) break
    }

    return {
      diagram: context.diagram!,
      diagnostics: context.diagnostics,
      isValid: !context.hasErrors(),
    }
  }

  /**
   * Devuelve los tokens generados por el lexer para un código fuente.
   * Útil para depuración.
   */
  public getTokens(source: string): Token[] {
    const lexer = LexerFactory.create(source)
    return lexer.tokenize()
  }
}
