import { LexerFactory } from './lexer/lexer.factory'
import { ParserFactory } from './parser/parser.factory'
import { SemanticAnalyzer } from './semantics/analyzer'
import type { IRDiagram } from './generator/ir/models'
import { ParserContext } from './parser/parser.context'
import { DiagnosticReporter } from './parser/diagnostic-reporter'
import { DiagnosticSeverity, type Diagnostic } from './syntax/diagnostic.types'
import { Token } from './syntax/token.types'
import { TypeScriptPlugin } from './plugins/typescript/typescript.plugin'

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

    // 0. Inicialización del Sistema de Semántica y Plugins
    const analyzer = new SemanticAnalyzer()

    // Solo registramos el plugin si detectamos que se solicita en la configuración del script
    // Esto evita consumo de memoria innecesario y efectos secundarios en el core UML
    if (source.includes('language:') && (source.includes('ts') || source.includes('typescript'))) {
      analyzer.getPluginManager().register(new TypeScriptPlugin())
      // No activamos aquí. La activación ocurrirá en el ConfigStore durante el análisis semántico
      // basándose en el valor real del nodo Config del AST.
    }

    const activePlugin = analyzer.getPluginManager().getActive() ?? undefined

    // 1. Análisis Léxico
    const lexer = LexerFactory.create(source, activePlugin)
    const tokens = lexer.tokenize()

    // 2. Análisis Sintáctico
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens, activePlugin)

    if (ast.diagnostics != null) {
      diagnostics.push(...ast.diagnostics)
    }

    // 3. Análisis Semántico
    const reporter = new DiagnosticReporter()
    const context = new ParserContext(tokens, reporter, activePlugin)

    const diagram = analyzer.analyze(ast, context)

    // Acumulamos diagnósticos del analizador semántico
    diagnostics.push(...reporter.getDiagnostics())

    return {
      diagram,
      diagnostics,
      isValid: !diagnostics.some((d) => d.severity === DiagnosticSeverity.ERROR),
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
