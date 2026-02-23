import { describe, it, expect } from 'vitest'
import { LexerFactory } from '@engine/lexer/lexer.factory'
import { ParserFactory } from '@engine/parser/parser.factory'

describe('Inline Enum Support', () => {
  const parse = (input: string) => {
    const lexer = LexerFactory.create(input)
    const tokens = lexer.tokenize()
    const parser = ParserFactory.create()
    return parser.parse(tokens)
  }

  it('should parse an attribute with an inline enum type', () => {
    const input = `
      class User {
        + status: > SubscriptionStatus(ACTIVE | CANCELLED | EXPIRED)
        + Price: number
      }
    `
    const program = parse(input)
    expect(program.diagnostics || []).toHaveLength(0)

    const cls = program.body[0] as import('../../syntax/nodes').EntityNode
    const attr = cls.body![0] as import('../../syntax/nodes').AttributeNode
    expect(attr.name).toBe('status')
    expect(attr.typeAnnotation.kind).toBe('enum')
    expect(attr.typeAnnotation.values).toContain('ACTIVE')

    const attr2 = cls.body![1] as import('../../syntax/nodes').AttributeNode
    expect(attr2.name).toBe('Price')
  })

  it('should parse the user provided class with inline enum', () => {
    const input = `
      class Subscription <> (
        Customer [1] >> LegalEntity, 
        Plan [*] >> BaseProduct >> CatalogItem
      ) {
        + startDate: Date
        + status: > SubscriptionStatus(ACTIVE | CANCELLED | EXPIRED)
        + priceOverride: decimal
        
        + calculateRenewalDate(): Date
        - validateBillingAddress(): boolean
      }
    `
    const program = parse(input)
    expect(program.diagnostics || []).toHaveLength(0)

    const cls = program.body[0] as import('../../syntax/nodes').EntityNode
    const members = cls.body!
    const statusAttr = members.find(
      (m): m is import('../../syntax/nodes').AttributeNode =>
        m.type === 'Attribute' && m.name === 'status',
    )!
    expect(statusAttr).toBeDefined()
    expect(statusAttr.typeAnnotation.kind).toBe('enum')
  })
})
