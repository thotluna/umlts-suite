import type { Token } from '../lexer/token.types';
import { TokenType } from '../lexer/token.types';
import { ASTNodeType } from './ast/nodes';
import type {
  ProgramNode,
  StatementNode
} from './ast/nodes';
import { ParserContext } from './parser.context';
import type { StatementRule, Orchestrator } from './rule.types';

export class Parser implements Orchestrator {
  private rules: StatementRule[];

  constructor(rules: StatementRule[]) {
    this.rules = rules;
  }

  public parse(tokens: Token[]): ProgramNode {
    const context = new ParserContext(tokens);
    const body: StatementNode[] = [];
    const firstToken = context.peek();

    while (!context.isAtEnd()) {
      try {
        if (context.match(TokenType.DOC_COMMENT)) {
          context.setPendingDocs(context.prev().value);
          continue;
        }

        const stmt = this.parseStatement(context);
        if (stmt) {
          body.push(stmt);
        } else {
          context.addError("Sentencia no reconocida");
          this.synchronize(context);
        }
      } catch (error: any) {
        context.addError(error.message || "Error sintáctico desconocido");
        this.synchronize(context);
      }
    }

    return {
      type: ASTNodeType.PROGRAM,
      body,
      line: firstToken?.line ?? 1,
      column: firstToken?.column ?? 1,
      // @ts-ignore - Añadimos diagnósticos al nodo raíz para facilitar el acceso
      diagnostics: context.getDiagnostics()
    };
  }

  /**
   * Se recupera de un error saltando tokens hasta un punto seguro (valla).
   */
  private synchronize(context: ParserContext): void {
    context.advance();

    while (!context.isAtEnd()) {
      // Si el token anterior terminó una sentencia o el actual comienza una nueva
      if (context.prev().type === TokenType.RBRACE) return;

      switch (context.peek().type) {
        case TokenType.KW_CLASS:
        case TokenType.KW_INTERFACE:
        case TokenType.KW_ENUM:
        case TokenType.KW_PACKAGE:
          return;
      }

      context.advance();
    }
  }

  /**
   * Intenta parsear una sentencia usando las reglas registradas.
   */
  public parseStatement(context: ParserContext): StatementNode | null {
    if (context.isAtEnd()) return null;

    for (const rule of this.rules) {
      const node = rule.parse(context, this);
      if (node) return node;
    }

    return null;
  }
}
