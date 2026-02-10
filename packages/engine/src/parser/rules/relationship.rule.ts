import { TokenType } from '../../lexer/token.types';
import type { RelationshipNode } from '../ast/nodes';
import { ASTNodeType } from '../ast/nodes';
import type { ParserContext } from '../parser.context';
import type { StatementRule } from '../rule.types';

export class RelationshipRule implements StatementRule {
  public parse(context: ParserContext): RelationshipNode | null {
    const pos = context.getPosition();

    try {
      const fromIsAbstract = context.match(TokenType.MOD_ABSTRACT, TokenType.KW_ABSTRACT);
      if (!context.check(TokenType.IDENTIFIER)) {
        if (fromIsAbstract) context.rollback(pos);
        return null;
      }

      const fromToken = context.consume(TokenType.IDENTIFIER, "Se esperaba un identificador");
      let fromMultiplicity: string | undefined = undefined;

      if (context.check(TokenType.LBRACKET)) {
        fromMultiplicity = this.parseMultiplicity(context);
      } else if (context.match(TokenType.STRING)) {
        fromMultiplicity = context.prev().value;
      }

      // El siguiente token debe ser un tipo de relación válido
      if (!this.isRelationshipType(context.peek().type)) {
        context.rollback(pos);
        return null;
      }

      const kind = context.advance().value;
      let toMultiplicity: string | undefined = undefined;

      if (context.check(TokenType.LBRACKET)) {
        toMultiplicity = this.parseMultiplicity(context);
      } else if (context.match(TokenType.STRING)) {
        toMultiplicity = context.prev().value;
      }

      const toIsAbstract = context.match(TokenType.MOD_ABSTRACT, TokenType.KW_ABSTRACT);
      const toToken = context.consume(TokenType.IDENTIFIER, "Se esperaba el nombre del objetivo de la relación");

      let label: string | undefined = undefined;
      if (context.match(TokenType.COLON)) {
        label = context.consume(TokenType.STRING, "Se esperaba una cadena de texto para la etiqueta").value;
      }

      return {
        type: ASTNodeType.RELATIONSHIP,
        from: fromToken.value,
        fromIsAbstract,
        fromMultiplicity,
        to: toToken.value,
        toIsAbstract,
        toMultiplicity,
        kind,
        label,
        docs: context.consumePendingDocs(),
        line: fromToken.line,
        column: fromToken.column
      };
    } catch (e) {
      context.rollback(pos);
      return null;
    }
  }

  private isRelationshipType(type: TokenType): boolean {
    return [
      TokenType.OP_INHERIT, TokenType.OP_IMPLEMENT, TokenType.OP_COMP, TokenType.OP_AGREG, TokenType.OP_USE,
      TokenType.KW_EXTENDS, TokenType.KW_IMPLEMENTS, TokenType.KW_COMP, TokenType.KW_AGREG, TokenType.KW_USE,
      TokenType.OP_GENERIC_REL, TokenType.GT
    ].includes(type);
  }

  private parseMultiplicity(context: ParserContext): string {
    let value = context.consume(TokenType.LBRACKET, "").value;
    while (!context.check(TokenType.RBRACKET) && !context.isAtEnd()) {
      value += context.advance().value;
    }
    value += context.consume(TokenType.RBRACKET, "Se esperaba ']'").value;
    return value;
  }
}
