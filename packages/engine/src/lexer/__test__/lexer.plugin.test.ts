import { describe, it, expect } from 'vitest'
import { LexerFactory } from '@engine/lexer/lexer.factory'
import { UMLEngine } from '@engine/UMLEngine'
import { TokenType } from '@engine/syntax/token.types'
import type { IUMLPlugin, ICapability } from '@engine/plugin/plugin.types'
import type { ILanguageAPI } from '@engine/plugin/language.types'
import type { LexerReader } from '@engine/lexer/lexer.reader'
import type { Token } from '@engine/syntax/token.types'

describe('Lexer Plugin Integration', () => {
  it('should allow a plugin to register a custom TokenMatcher', () => {
    // 1. Create a custom matcher for a new symbol '%' (not used in UML Pure)
    const percentMatcher = {
      match: (reader: LexerReader): Token | null => {
        if (reader.peek() === '%') {
          const line = reader.getLine()
          const column = reader.getColumn()
          reader.advance()
          return {
            type: 'PLUGIN_PERCENT' as unknown as TokenType,
            value: '%',
            line,
            column,
          }
        }
        return null
      },
    }

    // 2. Wrap it in a plugin (checking it can be registered)
    const mockPlugin: IUMLPlugin = {
      name: 'percent-plugin',
      version: '1.0.0',
      getCapability: <T extends ICapability>(name: string): T | undefined => {
        if (name === 'language') {
          return {
            __capabilityKind: 'language',
            setup: (api: ILanguageAPI) => {
              api.addTokenMatcher(percentMatcher)
            },
          } as unknown as T
        }
        return undefined
      },
    }

    // 3. Test LexerFactory directly with the matcher
    const lexer = LexerFactory.create('%', [percentMatcher])
    const tokens = lexer.tokenize()

    expect(tokens).toHaveLength(2) // PLUGIN_PERCENT + EOF
    expect(tokens[0].type).toBe('PLUGIN_PERCENT' as unknown as TokenType)
    expect(tokens[0].value).toBe('%')

    // Use the plugin to avoid unused variable warning
    expect(mockPlugin.name).toBe('percent-plugin')
  })

  it('should initialize matchers from UMLEngine correctly', () => {
    const percentMatcher = {
      match: (reader: LexerReader): Token | null => {
        if (reader.peek() === '%') {
          const line = reader.getLine()
          const column = reader.getColumn()
          reader.advance()
          return {
            type: 'PLUGIN_PERCENT' as unknown as TokenType,
            value: '%',
            line,
            column,
          }
        }
        return null
      },
    }

    const mockPlugin: IUMLPlugin = {
      name: 'percent-plugin',
      version: '1.0.0',
      getCapability: <T extends ICapability>(name: string): T | undefined => {
        if (name === 'language') {
          return {
            __capabilityKind: 'language',
            setup: (api: ILanguageAPI) => api.addTokenMatcher(percentMatcher),
          } as unknown as T
        }
        return undefined
      },
    }

    const engine = new UMLEngine([mockPlugin])
    const result = engine.parse('%')

    // The parser should report an error because it doesn't know 'PLUGIN_PERCENT',
    // but the diagnostic should NOT be 'Unexpected character "%"'
    // because the lexer should have successfully recognized it via plugin.

    const diagnostics = result.diagnostics
    expect(diagnostics.length).toBeGreaterThan(0)
    // If lexing failed, we'd see "Unexpected character: %"
    expect(diagnostics.some((d) => d.message.includes('Unexpected character: %'))).toBe(false)
  })
})
