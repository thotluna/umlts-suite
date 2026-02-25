import { describe, it, expect } from 'vitest'
import { UMLEngine, TokenType } from '@umlts/engine'
import { TypeScriptPlugin } from '@plugin-ts/index'

describe('TS Lexical Integration', () => {
  it('should lex TS keywords when plugin is active', () => {
    const engine = new UMLEngine([new TypeScriptPlugin()])
    const tokens = engine.getTokens('readonly type namespace')

    expect(tokens).toHaveLength(4) // 3 keywords + EOF
    expect(tokens[0].type).toBe(TokenType.KW_READONLY)
    expect(tokens[1].type).toBe(TokenType.KW_TYPE)
    expect(tokens[2].type).toBe(TokenType.KW_NAMESPACE)
  })

  it('should NOT lex TS keywords as KW_* when plugin is NOT active', () => {
    const engine = new UMLEngine([]) // No plugins
    const tokens = engine.getTokens('readonly type namespace')

    // In standard UML, these are just identifiers
    expect(tokens).toHaveLength(4)
    expect(tokens[0].type).toBe(TokenType.IDENTIFIER)
    expect(tokens[0].value).toBe('readonly')
    expect(tokens[1].type).toBe(TokenType.IDENTIFIER)
    expect(tokens[2].type).toBe(TokenType.IDENTIFIER)
  })

  it('should maintain priority: TS keyword shadows generic identifier', () => {
    const engine = new UMLEngine([new TypeScriptPlugin()])
    const tokens = engine.getTokens('readonly')

    // Even though it looks like an identifier, it should be matched by TSKeywordMatcher first
    expect(tokens[0].type).toBe(TokenType.KW_READONLY)
  })
})
