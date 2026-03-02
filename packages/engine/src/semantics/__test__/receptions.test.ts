import { describe, it, expect } from 'vitest'
import { UMLEngine } from '@engine/UMLEngine'

describe('Async Events & Active Classes', () => {
  const generateIR = (source: string) => {
    const engine = new UMLEngine()
    const result = engine.parse(source)
    if (!result.isValid) {
      console.error('Diagnostics:', JSON.stringify(result.diagnostics, null, 2))
    }
    return result.diagram
  }

  it('should detect Active Class with & modifier', () => {
    const source = `
      & class ActiveComp {}
    `
    const ir = generateIR(source)
    const entity = ir.entities.find((e) => e.name === 'ActiveComp')

    expect(entity).toBeDefined()
    expect(entity?.isActive).toBe(true)
  })

  it('should move methods with @receive to receptions compartment', () => {
    const source = `
      class Controller {
        @receive onSignal(payload: Data)
        normalMethod()
      }
      @signal class Data {}
    `
    const ir = generateIR(source)
    const controller = ir.entities.find((e) => e.name === 'Controller')

    expect(controller).toBeDefined()
    expect(controller?.operations).toHaveLength(1)
    expect(controller?.operations[0].name).toBe('normalMethod')

    expect(controller?.receptions).toHaveLength(1)
    expect(controller?.receptions?.[0].name).toBe('onSignal')
    expect(controller?.receptions?.[0].parameters[0].name).toBe('payload')
    expect(controller?.receptions?.[0].parameters[0].type).toBe('Data')
  })

  it('should support @async stereotype on operations', () => {
    const source = `
      class Service {
        @async fetchData()
        @async processLocal()
      }
    `
    const ir = generateIR(source)
    const service = ir.entities.find((e) => e.name === 'Service')

    expect(service).toBeDefined()
    expect(service?.operations).toHaveLength(2)

    const fetchData = service?.operations.find((op) => op.name === 'fetchData')
    const processLocal = service?.operations.find((op) => op.name === 'processLocal')

    expect(fetchData?.isAsync).toBe(true)
    expect(processLocal?.isAsync).toBe(true)
  })

  it('should support @send stereotype on relationships', () => {
    const source = `
      @send Producer >- Consumer
    `
    const ir = generateIR(source)
    const rel = ir.relationships[0]

    expect(rel).toBeDefined()
    expect(rel.stereotypes).toBeDefined()
    expect(rel.stereotypes?.some((s) => s.name === 'send')).toBe(true)
  })

  it('should support @send stereotype on inline relationships', () => {
    const source = `
      class Sensor {
        @send collector: >- Station
      }
    `
    const ir = generateIR(source)
    const sensor = ir.entities.find((e) => e.name === 'Sensor')

    expect(sensor).toBeDefined()
    // In IR, inline relationships currently create both a property and a relationship
    // The relationship should have the stereotype
    const rel = ir.relationships.find((r) => r.from === 'Sensor' && r.to === 'Station')
    expect(rel).toBeDefined()
    expect(rel?.stereotypes?.some((s) => s.name === 'send')).toBe(true)
  })
})
