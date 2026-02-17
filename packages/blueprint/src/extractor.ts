import * as path from 'path'
import { DiscoveryReport, DiscoveryService } from './scanner/discovery.service'
import { FileSystemProvider } from './scanner/providers/filesystem.provider'
import { BlueprintLexer } from './core/lexer/lexer'
import { SourceReader } from './reader/source-reader'
import { KeywordMatcher } from './core/lexer/matchers/keyword.matcher'
import { IdentifierMatcher } from './core/lexer/matchers/identifier.matcher'
import { SymbolMatcher } from './core/lexer/matchers/symbol.matcher'
import { ImportMatcher } from './core/lexer/matchers/import.matcher'
import { TokenType } from './core/lexer/types'
import { StringMatcher } from './core/lexer/matchers/string.matcher'
import { TypeExpressionParser } from './core/parser/type-parser'
import { SemanticAnalyzer } from './core/parser/semantics/analyzer'
import { UMLTSGenerator, UMLTSEntity } from './generator/umlts-generator'
import { RelationshipKind } from './core/parser/semantics/types'
import { TypeTranslator } from './core/parser/translation/translator'

/**
 * Orquestador principal de la extracción.
 */
export class BlueprintExtractor {
  private discovery: DiscoveryService
  private reader: SourceReader
  private lexer: BlueprintLexer
  private importMatcher = new ImportMatcher()
  private typeParser = new TypeExpressionParser()
  private semanticAnalyzer = new SemanticAnalyzer()
  private generator = new UMLTSGenerator()
  private translator = new TypeTranslator()

  constructor() {
    this.discovery = new DiscoveryService()
    this.discovery.registerProvider(new FileSystemProvider())
    this.reader = new SourceReader()

    const matchers = [
      this.importMatcher,
      new KeywordMatcher(),
      new IdentifierMatcher(),
      new StringMatcher(),
      new SymbolMatcher(),
    ]

    this.lexer = new BlueprintLexer(this.reader, matchers)
  }

  public async extract(input: string, rootDir: string = process.cwd()): Promise<string> {
    const report = await this.discovery.discover(input)
    this.logDiscovery(report)

    for (const unit of report.units) {
      /* eslint-disable no-console */
      console.log(`\n📖 Analizando: ${unit.name}`)

      const relativePath = path.relative(rootDir, path.dirname(unit.uri))
      const currentPackage = relativePath.replace(/\//g, '.') || 'root'
      const resolutionMap = new Map<string, string>()

      this.reader.open(unit.uri)
      const tokens = await this.lexer.tokenize()

      let currentEntityFqn: string | null = null
      let currentEntityObj: UMLTSEntity | null = null
      let braceLevel = 0
      let pendingModifiers: string[] = []

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]

        if (token.type === TokenType.SYMBOL) {
          if (token.value === '{') braceLevel++
          if (token.value === '}') {
            braceLevel--
            if (braceLevel === 0) {
              if (currentEntityObj) this.generator.addEntity(currentEntityObj)
              currentEntityFqn = null
              currentEntityObj = null
            }
          }
        }

        if (token.type === TokenType.IMPORT && braceLevel === 0) {
          const info = this.importMatcher.parse(token.value)
          if (info && info.path.startsWith('.')) {
            const absolutePath = path.resolve(path.dirname(unit.uri), info.path)
            const targetDir = path.dirname(absolutePath)
            const resolvedPackage = path.relative(rootDir, targetDir).replace(/\//g, '.')
            info.entities.forEach((entity) => resolutionMap.set(entity, resolvedPackage))
          }
        }

        if (
          token.type === TokenType.KEYWORD &&
          ['public', 'private', 'protected', 'static', 'readonly', 'abstract'].includes(token.value)
        ) {
          if (braceLevel <= 1) pendingModifiers.push(token.value)
          continue
        }

        const isEntityKeyword =
          token.type === TokenType.KEYWORD && ['class', 'interface', 'type'].includes(token.value)
        if (isEntityKeyword) {
          const kind = token.value.toUpperCase() as 'CLASS' | 'INTERFACE' | 'TYPE'
          let j = i + 1
          while (j < tokens.length && tokens[j].type !== TokenType.IDENTIFIER) j++

          if (j < tokens.length && tokens[j].type === TokenType.IDENTIFIER) {
            const { analysis: nameAnalysis, consumedCount: nameConsumed } = this.typeParser.parse(
              tokens,
              j,
            )
            const root = nameAnalysis.root
            const entityName = root.name
            const referencedName = tokens[j].value
            const resolvedPkg = resolutionMap.get(referencedName) || currentPackage
            currentEntityFqn = `${resolvedPkg}.${entityName}`

            currentEntityObj = {
              kind,
              name: entityName,
              packageName: resolvedPkg,
              members: [],
              modifiers: [...pendingModifiers],
            }
            pendingModifiers = []

            console.log(`\n   [Entity] ${kind} ${currentEntityFqn}`)

            let definitionRoot = root
            const nextIdx = j + nameConsumed
            if (kind === 'TYPE' && tokens[nextIdx]?.value === '=') {
              const { analysis: defAnalysis, consumedCount: defConsumed } = this.typeParser.parse(
                tokens,
                nextIdx + 1,
              )
              definitionRoot = defAnalysis.root

              const semantics = this.semanticAnalyzer.analyze(
                currentEntityFqn,
                definitionRoot,
                'alias',
              )
              semantics.forEach((rel) => {
                const pkg = resolutionMap.get(rel.target) || currentPackage
                this.generator.addExternalRelationship({ ...rel, target: `${pkg}.${rel.target}` })
                console.log(`      [Rel] ${rel.kind} -> ${pkg}.${rel.target}`)
              })

              i = nextIdx + defConsumed
              if (currentEntityObj) {
                this.generator.addEntity(currentEntityObj)
                currentEntityObj = null
                currentEntityFqn = null
              }
            } else {
              i = j + nameConsumed - 1
            }

            if (definitionRoot.members && definitionRoot.members.length > 0) {
              definitionRoot.members.forEach((m) => {
                const semantics = this.semanticAnalyzer.analyze(
                  currentEntityFqn!,
                  m.type,
                  'field',
                  m.name,
                )
                const { multiplicity, cleanType, stereotypes } = this.translator.translate(m.type)
                const isComplex =
                  semantics.length > 1 ||
                  semantics.some((s) => s.xorGroup || s.kind === RelationshipKind.REFINEMENT)
                const relSymbol =
                  !isComplex && semantics.length > 0
                    ? this.getRelSymbol(semantics[0].kind)
                    : undefined

                if (isComplex) {
                  semantics.forEach((s) => {
                    const pkg = resolutionMap.get(s.target) || currentPackage
                    this.generator.addExternalRelationship({
                      ...s,
                      target: `${pkg}.${s.target}`,
                    })
                  })
                }

                currentEntityObj?.members.push({
                  name: m.name,
                  type: cleanType,
                  visibility: '+',
                  isStatic: false,
                  isAbstract: false,
                  stereotype: stereotypes.length > 0 ? stereotypes.join(', ') : undefined,
                  multiplicity:
                    multiplicity || (semantics.length === 1 ? semantics[0].multiplicity : '1'),
                  relSymbol,
                })
                console.log(`      [Member] ${m.name}: ${m.type.fullLabel}`)
              })
            }
            braceLevel = 0
          }
        }

        if (token.type === TokenType.IDENTIFIER && currentEntityFqn && braceLevel === 1) {
          const memberName = token.value
          const next = tokens[i + 1]

          if (next && next.type === TokenType.SYMBOL) {
            const vis = pendingModifiers.includes('private')
              ? '-'
              : pendingModifiers.includes('protected')
                ? '#'
                : '+'

            if (next.value === '(') {
              const params: string[] = []
              let j = i + 2
              while (
                j < tokens.length &&
                !(tokens[j].type === TokenType.SYMBOL && tokens[j].value === ')')
              ) {
                if (tokens[j].type === TokenType.IDENTIFIER) {
                  const paramName = tokens[j].value
                  if (tokens[j + 1]?.value === ':') {
                    const { analysis, consumedCount } = this.typeParser.parse(tokens, j + 2)
                    const semantics = this.semanticAnalyzer.analyze(
                      currentEntityFqn,
                      analysis.root,
                      'param',
                      paramName,
                    )

                    const { multiplicity, cleanType } = this.translator.translate(analysis.root)

                    const needsExternalRel =
                      semantics.length > 1 ||
                      semantics.some((s) => s.xorGroup || s.kind === RelationshipKind.REFINEMENT)
                    const isComplex = semantics.length > 1 || semantics.some((s) => s.xorGroup)

                    const relSymbol =
                      !isComplex && semantics.length > 0
                        ? this.getRelSymbol(semantics[0].kind)
                        : undefined

                    if (needsExternalRel) {
                      semantics.forEach((s) => {
                        const pkg = resolutionMap.get(s.target) || currentPackage
                        this.generator.addExternalRelationship({
                          ...s,
                          target: `${pkg}.${s.target}`,
                        })
                      })
                    }

                    const relPart = relSymbol ? `${relSymbol} ` : ''
                    const multPart =
                      multiplicity && multiplicity !== '1' ? ` [${multiplicity}]` : ''
                    params.push(`${paramName}: ${relPart}${cleanType}${multPart}`)

                    j += consumedCount + 1
                  } else {
                    params.push(`${paramName}: any`)
                  }
                }
                j++
                if (tokens[j]?.value === ',') j++
              }

              let returnTypeInfo = {
                multiplicity: '1',
                cleanType: 'void',
                stereotypes: [] as string[],
              }
              let returnRelSymbol: string | undefined
              if (tokens[j]?.value === ')' && tokens[j + 1]?.value === ':') {
                const { analysis, consumedCount } = this.typeParser.parse(tokens, j + 2)
                const returnSemantics = this.semanticAnalyzer.analyze(
                  currentEntityFqn!,
                  analysis.root,
                  'return',
                  memberName,
                )
                const needsExternalRel =
                  returnSemantics.length > 1 ||
                  returnSemantics.some((s) => s.xorGroup || s.kind === RelationshipKind.REFINEMENT)
                const isComplex =
                  returnSemantics.length > 1 || returnSemantics.some((s) => s.xorGroup)

                if (needsExternalRel) {
                  returnSemantics.forEach((s) => {
                    const pkg = resolutionMap.get(s.target) || currentPackage
                    this.generator.addExternalRelationship({
                      ...s,
                      target: `${pkg}.${s.target}`,
                    })
                  })
                }

                if (!isComplex && returnSemantics.length > 0) {
                  returnRelSymbol = this.getRelSymbol(returnSemantics[0].kind)
                }
                returnTypeInfo = this.translator.translate(analysis.root)
                j += consumedCount + 1
              }

              currentEntityObj?.members.push({
                name: `${memberName}(${params.join(', ')})`,
                type: returnTypeInfo.cleanType,
                visibility: vis,
                isStatic: pendingModifiers.includes('static'),
                isAbstract: pendingModifiers.includes('abstract'),
                stereotype:
                  returnTypeInfo.stereotypes.length > 0
                    ? returnTypeInfo.stereotypes.join(', ')
                    : undefined,
                relSymbol: returnRelSymbol,
                multiplicity: returnTypeInfo.multiplicity,
              })

              console.log(`      [Method] ${vis}${memberName}(...): ${returnTypeInfo.cleanType}`)
              pendingModifiers = []
              i = j
            } else if (next.value === ':' || next.value === '=') {
              if (next.value === ':') {
                const { analysis, consumedCount } = this.typeParser.parse(tokens, i + 2)
                const semantics = this.semanticAnalyzer.analyze(
                  currentEntityFqn,
                  analysis.root,
                  'field',
                  memberName,
                )
                const { multiplicity, cleanType, stereotypes } = this.translator.translate(
                  analysis.root,
                )

                const needsExternalRel =
                  semantics.length > 1 ||
                  semantics.some((s) => s.xorGroup || s.kind === RelationshipKind.REFINEMENT)

                const isComplex = semantics.length > 1 || semantics.some((s) => s.xorGroup)

                const relSymbol =
                  !isComplex && semantics.length > 0
                    ? this.getRelSymbol(semantics[0].kind)
                    : undefined

                if (needsExternalRel) {
                  semantics.forEach((s) => {
                    const pkg = resolutionMap.get(s.target) || currentPackage
                    this.generator.addExternalRelationship({
                      ...s,
                      target: `${pkg}.${s.target}`,
                    })
                  })
                }

                currentEntityObj?.members.push({
                  name: memberName,
                  type: cleanType,
                  visibility: vis,
                  isStatic: pendingModifiers.includes('static'),
                  isAbstract: pendingModifiers.includes('abstract'),
                  stereotype: stereotypes.length > 0 ? stereotypes.join(', ') : undefined,
                  relSymbol,
                  multiplicity:
                    multiplicity || (semantics.length === 1 ? semantics[0].multiplicity : '1'),
                })

                console.log(`      [Attribute] ${vis}${memberName}: ${cleanType}`)
                i += consumedCount + 1
              }
              pendingModifiers = []
              const startLine = token.line
              while (i < tokens.length) {
                if (tokens[i].type === TokenType.SYMBOL && tokens[i].value === ';') break
                if (tokens[i + 1] && tokens[i + 1].line !== startLine) break
                i++
              }
            }
          }
        }

        if (token.type === TokenType.KEYWORD && currentEntityObj && braceLevel === 0) {
          if (token.value === 'extends' || token.value === 'implements') {
            const isExtends = token.value === 'extends'
            let j = i + 1
            while (
              j < tokens.length &&
              !(tokens[j].type === TokenType.SYMBOL && tokens[j].value === '{')
            ) {
              if (tokens[j].type === TokenType.IDENTIFIER) {
                const { analysis, consumedCount } = this.typeParser.parse(tokens, j)
                const baseName = tokens[j].value
                const pkg = resolutionMap.get(baseName) || currentPackage
                const fullTarget = `${pkg}.${analysis.root.fullLabel}`

                if (isExtends) {
                  currentEntityObj.extends = fullTarget
                } else {
                  currentEntityObj.implements = currentEntityObj.implements || []
                  currentEntityObj.implements.push(fullTarget)
                }

                j += consumedCount
                if (tokens[j]?.value === ',') {
                  j++
                  continue
                }
                break
              }
              j++
            }
            i = j - 1
          }
        }
      }
    }
    return this.generator.generate()
  }

  private getRelSymbol(kind: RelationshipKind): string {
    switch (kind) {
      case RelationshipKind.COMPOSITION:
        return '>*'
      case RelationshipKind.AGGREGATION:
        return '>+'
      case RelationshipKind.ASSOCIATION:
        return '><'
      case RelationshipKind.DEPENDENCY:
        return '>-'
      case RelationshipKind.REFINEMENT:
        return '>-'
      default:
        return '>-'
    }
  }

  private logDiscovery(report: DiscoveryReport): void {
    console.log('\n--- 🔍 Discovery Phase ---')
    console.log(`📄 Files found: ${report.units.length}`)
    console.log('--------------------------')
  }
}
