import type { LanguagePlugin, TypeMapping, ILexerReader, IParserContext } from '../language-plugin'
import type { Token } from '../../syntax/token.types'
import { TokenType } from '../../syntax/token.types'
import type { TypeNode } from '../../syntax/nodes'
import type { IREntity } from '../../generator/ir/models'
import { IREntityType, IRRelationshipType } from '../../generator/ir/models'

/**
 * TypeScript Language Plugin for UMLTS.
 */
export class TypeScriptPlugin implements LanguagePlugin {
  public readonly name = 'typescript'
  private isOptionalPending = false

  public matchToken(reader: ILexerReader): Token | null {
    const char = reader.peek()
    if (char === '?') {
      const line = reader.getLine()
      const column = reader.getColumn()
      reader.advance()
      return {
        type: TokenType.PLUGIN_TOKEN,
        value: '?',
        line,
        column,
      }
    }
    return null
  }

  public handleUnexpectedToken(context: IParserContext, token: Token): boolean {
    if (token.type === TokenType.PLUGIN_TOKEN && token.value === '?') {
      // En TS, un '?' después de un nombre de atributo indica opcionalidad.
      // Store this state to be used by the SemanticAnalyzer or future hooks.
      this.isOptionalPending = true
      context.advance()
      return true
    }
    return false
  }

  public getStandardLibrary(): IREntity[] {
    const tsTypesName = 'TypeScript'

    return [
      this.createPrimitive('any', tsTypesName),
      this.createPrimitive('void', tsTypesName),
      this.createPrimitive('never', tsTypesName),
      this.createPrimitive('unknown', tsTypesName),
      this.createPrimitive('object', tsTypesName),
      this.createPrimitive('symbol', tsTypesName),
      this.createPrimitive('bigint', tsTypesName),

      // Standard JSON/JS types as DataType (Values, not identities)
      this.createDataType('Date', tsTypesName),
      this.createDataType('URL', tsTypesName),
      this.createDataType('RegExp', tsTypesName),
      this.createDataType('Error', tsTypesName),

      // Templates (DataTypes in UML terminology)
      this.createTemplate('Promise', ['T'], tsTypesName),
      this.createTemplate('Array', ['T'], tsTypesName),
      this.createTemplate('Map', ['K', 'V'], tsTypesName),
      this.createTemplate('Set', ['T'], tsTypesName),
      this.createTemplate('Record', ['K', 'T'], tsTypesName),
      this.createTemplate('List', ['T'], tsTypesName),
      this.createTemplate('Collection', ['T'], tsTypesName),
      this.createTemplate('Observable', ['T'], tsTypesName),

      // Utility Types
      this.createTemplate('Partial', ['T'], tsTypesName),
      this.createTemplate('Pick', ['T', 'K'], tsTypesName),
      this.createTemplate('Omit', ['T', 'K'], tsTypesName),
      this.createTemplate('Readonly', ['T'], tsTypesName),
      this.createTemplate('Required', ['T'], tsTypesName),
      this.createTemplate('NonNullable', ['T'], tsTypesName),
    ]
  }

  public resolveType(type: TypeNode): TypeMapping | null {
    const baseName = type.name.toLowerCase()

    // 1. Handle Arrays (T[])
    if (type.kind === 'array') {
      return {
        targetName: type.raw.replace(/\[\]/g, '').trim(),
        multiplicity: '0..*',
        label: '{ordered}',
      }
    }

    // 2. Handle known collections as multiplicity (Array<T>, List<T>, Set<T>)
    const collectionsAsMultiplicity = new Set(['array', 'list', 'set', 'collection'])
    if (collectionsAsMultiplicity.has(baseName) && type.arguments && type.arguments.length > 0) {
      return {
        targetName: type.arguments[0].raw,
        multiplicity: '0..*',
        label: baseName === 'set' ? '{unique}' : '{ordered}',
      }
    }

    // 3. Handle Map<K, V> - usually we draw to V with K as qualifier/note or just ignore K
    if (baseName === 'map' && type.arguments && type.arguments.length >= 2) {
      return {
        targetName: type.arguments[1].raw,
        multiplicity: '*',
        label: `[${type.arguments[0].raw}]`,
      }
    }

    // 4. Handle Utility Types (Partial, Pick, Omit, etc.)
    const utilities = new Set(['partial', 'pick', 'omit', 'readonly', 'required', 'nonnullable'])
    if (utilities.has(baseName) && type.arguments && type.arguments.length > 0) {
      return {
        targetName: type.arguments[0].raw,
        relationshipType: IRRelationshipType.DEPENDENCY,
        label: `«${type.name}»`,
      }
    }

    // 5. Handle Wrapper Types (Promise, Observable)
    const wrappers = new Set(['promise', 'observable'])
    if (wrappers.has(baseName) && type.arguments && type.arguments.length > 0) {
      return {
        targetName: type.arguments[0].raw,
        relationshipType: IRRelationshipType.DEPENDENCY,
        label: `«${type.name}»`,
      }
    }

    return null
  }

  public mapPrimitive(name: string): string | null {
    const lower = name.toLowerCase()
    switch (lower) {
      case 'string':
        return 'String'
      case 'number':
        return 'Real' // Or Integer depending on context, but Real is safer
      case 'boolean':
        return 'Boolean'
      case 'date':
        return 'Date' // Mapeo directo a nuestro DataType estándar
      case 'void':
        return '' // Indica al motor que este tipo representa la "ausencia de tipo" en UML
      default:
        return null
    }
  }

  private createPrimitive(name: string, namespace: string): IREntity {
    return {
      id: `${namespace}.${name}`,
      name,
      type: IREntityType.PRIMITIVE_TYPE,
      properties: [],
      operations: [],
      isImplicit: false,
      isAbstract: false,
      isStatic: false,
      isActive: false,
      isLeaf: false,
      isFinal: false,
      isRoot: false,
      namespace,
    }
  }

  private createDataType(name: string, namespace: string): IREntity {
    return {
      ...this.createPrimitive(name, namespace),
      type: IREntityType.DATA_TYPE,
    }
  }

  private createTemplate(name: string, params: string[], namespace: string): IREntity {
    return {
      ...this.createPrimitive(name, namespace),
      typeParameters: params,
    }
  }
}
