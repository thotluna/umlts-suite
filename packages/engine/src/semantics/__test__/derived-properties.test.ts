import { describe, it, expect } from 'vitest'
import { UMLEngine } from '../../UMLEngine'
import { IREntity, IRProperty, IRVisibility } from '../../generator/ir/models'

describe('Derived Properties Semantics', () => {
  const engine = new UMLEngine()

  it('should parse a derived property with / prefix', () => {
    const dsl = `
      class Person {
        name: String
        /age: Integer
      }
    `
    const result = engine.parse(dsl)
    expect(result.diagnostics).toHaveLength(0)

    const person = result.diagram.entities.find((c) => c.name === 'Person') as IREntity
    expect(person).toBeDefined()

    const age = person.properties.find((p: IRProperty) => p.name === 'age') as IRProperty
    expect(age).toBeDefined()
    expect(age.isDerived).toBe(true)

    const name = person.properties.find((p: IRProperty) => p.name === 'name') as IRProperty
    expect(name).toBeDefined()
    expect(name.isDerived).toBe(false)
  })

  it('should parse derived properties with visibility and modifiers', () => {
    const dsl = `
      class FinancialInfo {
        - /balance: Money
        + /status: String {readonly}
      }
    `
    const result = engine.parse(dsl)
    expect(result.diagnostics).toHaveLength(0)

    const info = result.diagram.entities.find((c) => c.name === 'FinancialInfo') as IREntity
    const balance = info.properties.find((p: IRProperty) => p.name === 'balance') as IRProperty
    expect(balance.isDerived).toBe(true)
    expect(balance.visibility).toBe(IRVisibility.PRIVATE)

    const status = info.properties.find((p: IRProperty) => p.name === 'status') as IRProperty
    expect(status.isDerived).toBe(true)
    expect(status.visibility).toBe(IRVisibility.PUBLIC)
    expect(status.isReadOnly).toBe(true)
  })

  it('should parse the complex example from derived-properties.umlts', () => {
    const dsl = `
      class Invoice {
        subtotal: Real
        taxRate: Real = 0.16
        
        // Propiedad derivada (calculada)
        / total: Real
        
        // Atributo privado con getter derivado
        - _items: LineItem[*]
        / itemsCount: Integer {readonly}
      }

      class LineItem {
        product: String
        quantity: Integer
        unitPrice: Real
        / lineTotal: Real
      }
    `
    const result = engine.parse(dsl)
    expect(result.diagnostics).toHaveLength(0)
  })
})
