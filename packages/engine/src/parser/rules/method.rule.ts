import type { Token } from '../../lexer/token.types';
import { TokenType } from '../../lexer/token.types';
import { ASTNodeType, MethodNode, TypeNode } from '../ast/nodes';
import type { ParserContext } from '../parser.context';
import { TypeRule } from './type.rule';
import { ParameterRule } from './parameter.rule';

export class MethodRule {
  private typeRule = new TypeRule();
  private parameterRule = new ParameterRule();

  public parse(context: ParserContext, name: Token, visibility: string, isStatic: boolean, isAbstract: boolean): MethodNode {
    context.consume(TokenType.LPAREN, "");
    const parameters = [];

    if (!context.check(TokenType.RPAREN)) {
      do {
        parameters.push(this.parameterRule.parse(context));
      } while (context.match(TokenType.COMMA));
    }

    context.consume(TokenType.RPAREN, "Se esperaba ')' después de los parámetros");

    let returnType: TypeNode = {
      type: ASTNodeType.TYPE,
      kind: 'simple',
      name: 'void',
      raw: 'void',
      line: name.line,
      column: name.column
    };
    let returnRelationshipKind: string | undefined = undefined;
    let returnTargetIsAbstract = false;

    if (context.match(TokenType.COLON)) {
      // SOPORTE SECCIÓN 5.3: Operadores de relación en tipo de retorno
      if (context.match(
        TokenType.OP_INHERIT, TokenType.OP_IMPLEMENT, TokenType.OP_COMP,
        TokenType.OP_AGREG, TokenType.OP_USE, TokenType.OP_GENERIC_REL
      )) {
        returnRelationshipKind = context.prev().value;
      }

      returnTargetIsAbstract = context.match(TokenType.MOD_ABSTRACT, TokenType.KW_ABSTRACT);
      returnType = this.typeRule.parse(context);
    }

    return {
      type: ASTNodeType.METHOD,
      name: name.value,
      visibility,
      isStatic,
      isAbstract,
      parameters,
      returnType,
      returnRelationshipKind,
      returnTargetIsAbstract,
      docs: context.consumePendingDocs(),
      line: name.line,
      column: name.column
    };
  }
}
