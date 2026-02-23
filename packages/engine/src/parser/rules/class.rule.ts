import { TokenType } from '../../syntax/token.types'
import { ASTNodeType } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import { ModifierRule } from './modifier.rule'
import { BaseEntityRule } from './base-entity.rule'

/**
 * ClassRule: Regla especializada para el parseo de Clases.
 */
export class ClassRule extends BaseEntityRule {
  public canHandle(context: IParserHub): boolean {
    const skip = ModifierRule.countModifiers(context)
    return context.lookahead(skip).type === TokenType.KW_CLASS
  }

  protected getSupportedKeywords(): TokenType[] {
    return [TokenType.KW_CLASS]
  }

  protected getASTNodeType(): ASTNodeType.CLASS {
    return ASTNodeType.CLASS
  }
}
