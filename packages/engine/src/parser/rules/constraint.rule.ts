<<<<<<< HEAD
import { TokenType } from '../../syntax/token.types'
import { ASTNodeType, type ConstraintNode, type StatementNode } from '../../syntax/nodes'
=======
import { TokenType } from '../../lexer/token.types'
import { ASTNodeType, ConstraintNode, StatementNode } from '../ast/nodes'
>>>>>>> a5d1e8a (feat: implement XOR relationship constraints support)
import type { ParserContext } from '../parser.context'
import type { StatementRule, Orchestrator } from '../rule.types'

/**
 * ConstraintRule: Maneja restricciones globales y bloques xor.
 * Soporta bloque: xor { A -- B }
 * Soporta individual: {ordered}
 */
export class ConstraintRule implements StatementRule {
  public canStart(context: ParserContext): boolean {
    return context.check(TokenType.KW_XOR) || context.check(TokenType.LBRACE)
  }

  public parse(context: ParserContext, orchestrator: Orchestrator): StatementNode[] {
    if (context.match(TokenType.KW_XOR)) {
      const startToken = context.prev()

      // Caso 1: Bloque xor { ... }
      if (context.match(TokenType.LBRACE)) {
        const body: StatementNode[] = []
        while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
          const nodes = orchestrator.parseStatement(context)
          if (nodes.length > 0) {
            body.push(...nodes)
          } else {
            // Si una regla falla, avanzamos para evitar bucle infinito
            context.advance()
          }
        }
        context.consume(TokenType.RBRACE, "Expected '}' at the end of xor block")

        return [
          {
            type: ASTNodeType.CONSTRAINT,
            kind: 'xor',
            body,
            line: startToken.line,
            column: startToken.column,
          },
        ]
      }

      // TODO: Soporte para xor (Rel1, Rel2) si se desea en el futuro
    }

    if (context.check(TokenType.LBRACE)) {
      return [ConstraintRule.parseInline(context)]
    }

    return []
  }

  /**
   * Parseador de restricciones in-line {...}
   */
  public static parseInline(context: ParserContext): ConstraintNode {
    context.consume(TokenType.LBRACE, "Expected '{'")
    const startToken = context.prev()

    let kind = 'custom'
    const targets: string[] = []
    let expression = ''

    // Detectar keywords conocidos dentro
    if (context.match(TokenType.KW_XOR)) {
      kind = 'xor'
      if (context.match(TokenType.COLON)) {
        targets.push(context.consume(TokenType.IDENTIFIER, 'Group identifier expected').value)
      }
    } else {
      // Captura genérica de tokens hasta }
      const tokens: string[] = []
      while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
        tokens.push(context.advance().value)
      }
      expression = tokens.join(' ')
      kind = expression.split(/[:\s]/)[0] || 'custom'
    }

    // Asegurar cierre
    while (!context.match(TokenType.RBRACE) && !context.isAtEnd()) {
      context.advance()
    }

    return {
      type: ASTNodeType.CONSTRAINT,
      kind,
      targets: targets.length > 0 ? targets : undefined,
      expression: expression || undefined,
      line: startToken.line,
      column: startToken.column,
    }
  }
}
