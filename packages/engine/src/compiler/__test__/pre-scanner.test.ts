import { describe, it, expect } from 'vitest'
import { ConfigPreScanner } from '../pre-scanner'

describe('ConfigPreScanner', () => {
  it('should detect language in block syntax', () => {
    const source = `
      config {
        language: "typescript",
        theme: "dark"
      }
      class User {}
    `
    expect(ConfigPreScanner.scanLanguage(source)).toBe('typescript')
  })

  it('should detect language in line syntax (@)', () => {
    const source = `
      @language: "java"
      class User {}
    `
    expect(ConfigPreScanner.scanLanguage(source)).toBe('java')
  })

  it('should detect language without quotes', () => {
    const source = `@language: typescript`
    expect(ConfigPreScanner.scanLanguage(source)).toBe('typescript')
  })

  it('should return undefined if no language is found', () => {
    const source = `class User {}`
    expect(ConfigPreScanner.scanLanguage(source)).toBeUndefined()
  })

  it('should handle multiple config blocks and pick the first one with language', () => {
    const source = `
      config { theme: "light" }
      config { language: "typescript" }
    `
    expect(ConfigPreScanner.scanLanguage(source)).toBe('typescript')
  })
})
