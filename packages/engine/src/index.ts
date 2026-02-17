import { LexerFactory } from './lexer/lexer.factory'
import { ParserFactory } from './parser/parser.factory'
import { SemanticAnalyzer } from './semantics/analyzer'
import type { IRDiagram } from './generator/ir/models'
import { ParserContext } from './parser/parser.context'
import { DiagnosticReporter } from './parser/diagnostic-reporter'
import type { Diagnostic } from './syntax/diagnostic.types'
import type { Token } from './syntax/token.types'

export * from './generator/ir/models'
export * from './syntax/diagnostic.types'
export * from './syntax/token.types'
export * from './syntax/nodes'

/**
 * Resultado de una operación de parseo del motor.
 */
export interface ParseResult {
  /** El diagrama resultante en Representación Intermedia (IR) */
  diagram: IRDiagram
  /** Lista de diagnósticos (errores léxicos, sintácticos y semánticos) */
  diagnostics: Diagnostic[]
  /** Indica si hubo errores fatales que impidieron generar un diagrama válido */
  isValid: boolean
}

/**
 * Fachada principal del motor ts-uml-engine.
 * Orquesta las fases del compilador en un flujo único.
 */
export class UMLEngine {
  /**
   * Procesa código fuente UMLTS y devuelve una representación intermedia resuelta.
   *
   * @param source - El código fuente en lenguaje UMLTS.
   * @returns Un objeto con el diagrama y los diagnósticos acumulados.
   */
  public parse(source: string): ParseResult {
    const diagnostics: Diagnostic[] = []

    // 1. Análisis Léxico
    const lexer = LexerFactory.create(source)
    const tokens = lexer.tokenize()

    // 2. Análisis Sintáctico
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    // Acumulamos diagnósticos iniciales (Parser ya los tiene enast.diagnostics si usamos un reporter local allí,
    // pero para máxima integración, vamos a centralizar el reporte)
    if (ast.diagnostics != null) {
      diagnostics.push(...ast.diagnostics)
    }

    // 3. Análisis Semántico
    // Necesitamos un context para el analyzer que comparta los errores si queremos,
    // o uno nuevo que capture solo los semánticos.
    // Dado que ParserContext ahora requiere un reporter, vamos a dárselo.
    const reporter = new DiagnosticReporter()
    const context = new ParserContext(tokens, reporter)
    const analyzer = new SemanticAnalyzer()
    const diagram = analyzer.analyze(ast, context)

    // Acumulamos diagnósticos del analizador semántico
    diagnostics.push(...reporter.getDiagnostics())

    return {
      diagram,
      diagnostics,
      isValid: diagnostics.length === 0,
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
