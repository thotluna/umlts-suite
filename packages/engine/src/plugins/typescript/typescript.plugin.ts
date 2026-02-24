import type {
  LanguagePlugin,
  TypeMapping,
  ILexerReader,
  IPluginMemberProvider,
  ISemanticSession,
} from '@engine/plugins/language-plugin'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { Token } from '@engine/syntax/token.types'
import { TokenType } from '@engine/syntax/token.types'
import type { TypeNode } from '@engine/syntax/nodes'
import type { IREntity } from '@engine/generator/ir/models'
import { IREntityType, IRRelationshipType } from '@engine/generator/ir/models'

/**
 * TypeScript Language Plugin for UMLTS.
 */
export class TypeScriptPlugin implements LanguagePlugin {
  public readonly name = 'typescript'

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

  public getMemberRules(): IPluginMemberProvider[] {
    return [
      {
        canHandle: (_context: IParserHub) => false,
        parse: (_context: IParserHub) => null,
      },
    ]
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
      this.createPrimitive('string', tsTypesName),
      this.createPrimitive('number', tsTypesName),
      this.createPrimitive('boolean', tsTypesName),

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
    let result: TypeMapping | null = null

    // Helper method to "peel" wrapper types recursively
    const resolveInternal = (node: TypeNode): TypeMapping | null => {
      const base = node.name.toLowerCase()

      // 1. Handle Arrays (T[]) — including explicit multiplicities like T[1..*]
      if (node.kind === 'array') {
        // Strip any trailing [...] suffix and extract the explicit multiplicity if present
        const multiplicityMatch = /\[([^\]]*)\]\s*$/.exec(node.raw)
        const explicitMultiplicity = multiplicityMatch?.[1]
        const baseRaw = node.raw.replace(/\[[^\]]*\]\s*$/, '').trim()

        const nested = this.resolveType({
          ...node,
          kind: 'simple',
          raw: baseRaw,
          name: node.name,
        })

        const resolvedMultiplicity = explicitMultiplicity
          ? explicitMultiplicity.includes('..')
            ? explicitMultiplicity
            : `0..${explicitMultiplicity}`
          : '0..*'

        return {
          targetName: nested?.targetName || baseRaw,
          multiplicity: resolvedMultiplicity,
          label: nested?.label ? `${nested.label}\n{ordered}` : '{ordered}',
          relationshipType: nested?.relationshipType,
        }
      }

      // 2. Handle known collections as multiplicity (Array<T>, List<T>, Set<T>)
      const collections = new Set(['array', 'list', 'set', 'collection'])
      if (collections.has(base) && node.arguments && node.arguments.length > 0) {
        const nested = this.resolveType(node.arguments[0])
        return {
          targetName: nested?.targetName || node.arguments[0].raw,
          multiplicity: '0..*',
          label: nested?.label
            ? `${nested.label}\n${base === 'set' ? '{unique}' : '{ordered}'}`
            : base === 'set'
              ? '{unique}'
              : '{ordered}',
          relationshipType: nested?.relationshipType,
        }
      }

      // 3. Handle Map<K, V>
      if (base === 'map' && node.arguments && node.arguments.length >= 2) {
        const nested = this.resolveType(node.arguments[1])
        return {
          targetName: nested?.targetName || node.arguments[1].raw,
          multiplicity: '*',
          label: nested?.label
            ? `[${node.arguments[0].raw}]\n${nested.label}`
            : `[${node.arguments[0].raw}]`,
          relationshipType: nested?.relationshipType,
        }
      }

      // 4. Handle Utility Types (Partial, Pick, Omit, etc.)
      const utilities = new Set(['partial', 'pick', 'omit', 'readonly', 'required', 'nonnullable'])
      if (utilities.has(base) && node.arguments && node.arguments.length > 0) {
        const nested = this.resolveType(node.arguments[0])
        return {
          targetName: nested?.targetName || node.arguments[0].raw,
          relationshipType: nested?.relationshipType || IRRelationshipType.DEPENDENCY,
          label: nested?.label ? `«${node.name}»\n${nested.label}` : `«${node.name}»`,
          multiplicity: nested?.multiplicity,
        }
      }

      // 5. Handle Wrapper Types (Promise, Observable)
      const wrappers = new Set(['promise', 'observable'])
      if (wrappers.has(base) && node.arguments && node.arguments.length > 0) {
        const nested = this.resolveType(node.arguments[0])
        return {
          targetName: nested?.targetName || node.arguments[0].raw,
          relationshipType: nested?.relationshipType || IRRelationshipType.DEPENDENCY,
          label: nested?.label ? `«${node.name}»\n${nested.label}` : `«${node.name}»`,
          multiplicity: nested?.multiplicity,
        }
      }

      return null
    }

    result = resolveInternal(type)
    return result
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

  public onPostAnalysis(session: ISemanticSession): void {
    const isTS = session.configStore.get().language === 'typescript'
    if (!isTS) return

    session.relationships.forEach((rel) => {
      const source = session.symbolTable.get(rel.from)
      const target = session.symbolTable.get(rel.to)

      if (target && target.type === IREntityType.DATA_TYPE) {
        if (rel.type === IRRelationshipType.IMPLEMENTATION) {
          target.type = IREntityType.INTERFACE
        } else if (rel.type === IRRelationshipType.INHERITANCE) {
          if (source && source.type === IREntityType.INTERFACE) {
            target.type = IREntityType.INTERFACE
          } else {
            target.type = IREntityType.CLASS
          }
        }
      }

      if (source && source.type === IREntityType.DATA_TYPE) {
        if (
          rel.type === IRRelationshipType.INHERITANCE ||
          rel.type === IRRelationshipType.IMPLEMENTATION
        ) {
          source.type = IREntityType.CLASS
        }
      }
    })
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
