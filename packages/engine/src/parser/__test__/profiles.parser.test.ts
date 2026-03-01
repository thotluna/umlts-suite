import { describe, it, expect } from 'vitest'
import { ParserFactory } from '@engine/parser/parser.factory'
import { LexerFactory } from '@engine/lexer/lexer.factory'
import { ASTNodeType } from '@engine/syntax/nodes'

describe('Profiles and Stereotypes Parser Support', () => {
  it('should parse a simple profile with a stereotype', () => {
    const code = `
      profile MyProfile {
        stereotype Entity >> class {
          table: String = "users"
        }
      }
    `
    const tokens = LexerFactory.create(code).tokenize()
    const ast = ParserFactory.create().parse(tokens)

    const profile = ast.body[0]
    expect(profile).toBeDefined()
    expect(profile.type).toBe(ASTNodeType.PROFILE)
    if (profile.type === ASTNodeType.PROFILE) {
      expect(profile.name).toBe('MyProfile')
      expect(profile.body).toHaveLength(1)
      const stereotype = profile.body[0]
      expect(stereotype.name).toBe('Entity')
      expect(stereotype.extends).toContain('Class')
      expect(stereotype.properties).toHaveLength(1)
      expect(stereotype.properties[0].name).toBe('table')
      expect(stereotype.properties[0].defaultValue).toBe('users')
    }
  })

  it('should parse stereotype applications on classes', () => {
    const code = `
      @Entity
      @Table
      class User {
        [ table="users", column="id", primary=true ]
        id: String
      }
    `
    const tokens = LexerFactory.create(code).tokenize()
    const ast = ParserFactory.create().parse(tokens)

    const userClass = ast.body[0]
    expect(userClass).toBeDefined()
    expect(userClass.type).toBe(ASTNodeType.CLASS)
    if (userClass.type === ASTNodeType.CLASS) {
      expect(userClass.stereotypes).toHaveLength(2)
      expect(userClass.stereotypes![0].name).toBe('Entity')
      expect(userClass.stereotypes![1].name).toBe('Table')

      // Tagged values go in the metadata compartment, not inline with @
      const metadata = userClass.body?.find((m) => m.type === ASTNodeType.METADATA)
      expect(metadata).toBeDefined()
      if (metadata?.type === ASTNodeType.METADATA) {
        expect(metadata.values).toMatchObject({ table: 'users', column: 'id', primary: true })
      }
    }
  })

  it('should parse stereotype applications on relationships', () => {
    const code = `
      @trace
      User >> Auth
    `
    const tokens = LexerFactory.create(code).tokenize()
    const ast = ParserFactory.create().parse(tokens)

    const rel = ast.body[0]
    expect(rel).toBeDefined()
    expect(rel.type).toBe(ASTNodeType.RELATIONSHIP)
    if (rel.type === ASTNodeType.RELATIONSHIP) {
      expect(rel.stereotypes).toHaveLength(1)
      expect(rel.stereotypes![0].name).toBe('trace')
    }
  })

  it('should parse stereotype applications on interfaces and enums', () => {
    const code = `
      @Service
      interface IAuth {}

      @Flags
      enum Status {
        ACTIVE,
        INACTIVE
      }
    `
    const tokens = LexerFactory.create(code).tokenize()
    const ast = ParserFactory.create().parse(tokens)

    const iface = ast.body[0]
    expect(iface.type).toBe(ASTNodeType.INTERFACE)
    if (iface.type === ASTNodeType.INTERFACE) {
      expect(iface.stereotypes).toHaveLength(1)
      expect(iface.stereotypes![0].name).toBe('Service')
    }

    const enumeration = ast.body[1]
    expect(enumeration.type).toBe(ASTNodeType.ENUM)
    if (enumeration.type === ASTNodeType.ENUM) {
      expect(enumeration.stereotypes).toHaveLength(1)
      expect(enumeration.stereotypes![0].name).toBe('Flags')
    }
  })
})
