import { TokenType } from '../../lexer/token.types';
import type { StatementNode, CommentNode } from '../ast/nodes';
import { ASTNodeType } from '../ast/nodes';
import type { ParserContext } from '../parser.context';
import type { StatementRule } from '../rule.types';

export class CommentRule implements StatementRule {
  public parse(context: ParserContext): CommentNode | null {
    if (context.check(TokenType.COMMENT)) {
      const token = context.consume(TokenType.COMMENT, "");
      return {
        type: ASTNodeType.COMMENT,
        value: token.value,
        line: token.line,
        column: token.column
      };
    }
    return null;
  }
}
