import { TokenType } from '../../syntax/token.types'
import { ASTNodeType } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import { ModifierRule } from './modifier.rule'
import { BaseEntityRule } from './base-entity.rule'

/**
 * InterfaceRule: Regla especializada para el parseo de Interfaces.
 */
export class InterfaceRule extends BaseEntityRule {
  public canHandle(context: IParserHub): boolean {
    const skip = ModifierRule.countModifiers(context)
    return context.lookahead(skip).type === TokenType.KW_INTERFACE
  }

  protected getSupportedKeywords(): TokenType[] {
    return [TokenType.KW_INTERFACE]
  }

  protected getASTNodeType(): ASTNodeType.INTERFACE {
    return ASTNodeType.INTERFACE
  }
}
