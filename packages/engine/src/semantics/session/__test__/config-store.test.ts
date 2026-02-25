import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ConfigStore } from '@engine/semantics/session/config-store'
import type { SymbolTable } from '@engine/semantics/symbol-table'

describe('ConfigStore', () => {
  let store: ConfigStore
  let symbolTable: SymbolTable

  beforeEach(() => {
    symbolTable = {
      register: vi.fn(),
    } as unknown as SymbolTable
    store = new ConfigStore(symbolTable)
  })

  it('should initialize with empty config', () => {
    expect(store.get()).toEqual({})
  })

  it('should merge configuration', () => {
    store.merge({ key1: 'value1' })
    expect(store.get()).toEqual({ key1: 'value1' })

    store.merge({ key2: 'value2', key1: 'new-value' })
    expect(store.get()).toEqual({ key1: 'new-value', key2: 'value2' })
  })

  it('should return a copy of the configuration', () => {
    const original = { a: 1 }
    store.merge(original)
    const result = store.get()
    result.a = 2

    expect(store.get().a).toBe(1)
  })
})
