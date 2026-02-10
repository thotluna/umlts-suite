
import { LexerFactory } from './lexer/lexer.factory';
import { ParserFactory } from './parser/parser.factory';
import { SemanticAnalyzer } from './semantics/analyzer';
import type { IRDiagram } from './generator/ir/models';
import type { Diagnostic } from './parser/diagnostic.types';

/**
 * Resultado de una operación de parseo del motor.
 */
export interface ParseResult {
  /** El diagrama resultante en Representación Intermedia (IR) */
  diagram: IRDiagram;
  /** Lista de diagnósticos (errores léxicos, sintácticos y semánticos) */
  diagnostics: Diagnostic[];
  /** Indica si hubo errores fatales que impidieron generar un diagrama válido */
  isValid: boolean;
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
    const diagnostics: Diagnostic[] = [];

    // 1. Análisis Léxico
    const lexer = LexerFactory.create(source);
    const tokens = lexer.tokenize();

    // 2. Análisis Sintáctico
    const parser = ParserFactory.create();
    const ast = parser.parse(tokens);

    // Acumulamos diagnósticos del parser
    if (ast.diagnostics) {
      diagnostics.push(...ast.diagnostics);
    }

    // 3. Análisis Semántico
    // IMPORTANTE: Instanciamos un nuevo analizador por cada parseo para evitar
    // la filtración de estado entre cambios de código (evita duplicados acumulados).
    const analyzer = new SemanticAnalyzer();
    const diagram = analyzer.analyze(ast);

    return {
      diagram,
      diagnostics,
      isValid: diagnostics.length === 0
    };
  }

  /**
   * Devuelve los tokens generados por el lexer para un código fuente.
   * Útil para depuración.
   */
  public getTokens(source: string): any[] {
    const lexer = LexerFactory.create(source);
    return lexer.tokenize();
  }
}
