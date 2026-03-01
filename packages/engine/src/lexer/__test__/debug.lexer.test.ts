import { describe, it } from 'vitest'
import { LexerFactory } from '@engine/lexer/lexer.factory'

describe('DEBUG LEXER', () => {
  it('should list tokens', () => {
    const code = 'profile MyProfile { stereotype Entity }'
    const tokens = LexerFactory.create(code).tokenize()
    console.log('TOKENS:', tokens.map((t) => `${t.type}: ${t.value}`).join(', '))
  })
})
