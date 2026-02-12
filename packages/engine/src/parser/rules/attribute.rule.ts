import type { Token } from '../../lexer/token.types';
import { TokenType } from '../../lexer/token.types';
import { ASTNodeType, AttributeNode } from '../ast/nodes';
import type { ParserContext } from '../parser.context';
import { TypeRule } from './type.rule';

export class AttributeRule {
  private typeRule = new TypeRule();

  public parse(context: ParserContext, name: Token, visibility: string, isStatic: boolean): AttributeNode {
    context.consume(TokenType.COLON, "Se esperaba ':' después del nombre del atributo");

    // SOPORTE SECCIÓN 5.2 DE LA ESPECIFICACIÓN: Soporte de relaciones in-line
    let relationshipKind: string | undefined = undefined;
    if (context.match(
      TokenType.OP_INHERIT, TokenType.OP_IMPLEMENT, TokenType.OP_COMP,
      TokenType.OP_AGREG, TokenType.OP_USE, TokenType.OP_GENERIC_REL
    )) {
      relationshipKind = context.prev().value;
    }

    const targetIsAbstract = context.match(TokenType.MOD_ABSTRACT, TokenType.KW_ABSTRACT);
    const typeAnnotation = this.typeRule.parse(context);
    let multiplicity: string | undefined = undefined;

    if (context.match(TokenType.LBRACKET)) {
      multiplicity = '[';
      while (!context.check(TokenType.RBRACKET) && !context.isAtEnd()) {
        multiplicity += context.advance().value;
      }
      multiplicity += context.consume(TokenType.RBRACKET, "Se esperaba ']'").value;
    }

    return {
      type: ASTNodeType.ATTRIBUTE,
      name: name.value,
      visibility,
      isStatic,
      typeAnnotation,
      multiplicity,
      relationshipKind,
      targetIsAbstract,
      docs: context.consumePendingDocs(),
      line: name.line,
      column: name.column
    };
  }
}
