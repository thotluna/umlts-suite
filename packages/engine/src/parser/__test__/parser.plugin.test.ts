import { describe, it, expect } from 'vitest'
import { UMLEngine } from '@engine/UMLEngine'
import { TokenType } from '@engine/syntax/token.types'
import type { IUMLPlugin, ICapability } from '@engine/plugin/plugin.types'
import type { ILanguageAPI } from '@engine/plugin/language.types'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { StatementRule } from '@engine/parser/rule.types'
import { ASTFactory } from '@engine/parser/factory/ast.factory'

describe('Parser Plugin Integration', () => {
  it('should allow a plugin to register a custom StatementRule', () => {
    // 1. Create a custom rule for '@' that returns a Comment node
    const customRule: StatementRule = {
      canHandle: (context: IParserHub) => context.check(TokenType.AT),
      parse: (context: IParserHub): import('../../syntax/nodes').StatementNode[] => {
        const token = context.advance()
        return [ASTFactory.createComment('Custom Comment via @', token.line, token.column)]
      },
    }

    const mockPlugin: IUMLPlugin = {
      name: 'custom-rule-plugin',
      version: '1.0.0',
      getCapability: <T extends ICapability>(name: string): T | undefined => {
        if (name === 'language') {
          return {
            __capabilityKind: 'language',
            setup: (api: ILanguageAPI) => {
              api.addStatementRule(customRule)
            },
          } as unknown as T
        }
        return undefined
      },
    }

    const engine = new UMLEngine([mockPlugin])
    const result = engine.parse('@')

    expect(result.isValid).toBe(true)
    expect(result.diagnostics).toHaveLength(0)
  })

  it('should allow a plugin to register custom Type Primaries', () => {
    // Provider for a type that starts with '#'
    const customTypeProvider = {
      canHandle: (context: IParserHub) => context.check(TokenType.VIS_PROT), // '#'
      parse: (context: IParserHub) => {
        const token = context.advance()
        return ASTFactory.createType('SpecialType', 'simple', '#', token.line, token.column)
      },
    }

    const mockPlugin: IUMLPlugin = {
      name: 'type-provider-plugin',
      version: '1.0.0',
      getCapability: <T extends ICapability>(name: string): T | undefined => {
        if (name === 'language') {
          return {
            __capabilityKind: 'language',
            setup: (api: ILanguageAPI) => {
              api.addTypePrimary(customTypeProvider)
            },
          } as unknown as T
        }
        return undefined
      },
    }

    const engine = new UMLEngine([mockPlugin])
    // attr : #
    const result = engine.parse('class A { attr : # }')

    expect(result.isValid).toBe(true)
    expect(result.diagnostics).toHaveLength(0)
  })
})
