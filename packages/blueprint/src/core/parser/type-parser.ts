import { Token, TokenType } from '../lexer/types'
import { TypeAnalysis, TypeNode } from './types'

/**
 * Parser recursivo de arquitectura profesional para tipos de TypeScript.
 * Su objetivo es extraer la firma semántica COMPLETA, no solo el texto.
 */
export class TypeExpressionParser {
  public parse(
    tokens: Token[],
    startIndex: number,
  ): { analysis: TypeAnalysis; consumedCount: number } {
    const references = new Set<string>()
    const { node, consumed } = this.parseRecursive(tokens, startIndex, references)

    return {
      analysis: {
        root: node,
        references: Array.from(references),
      },
      consumedCount: consumed,
    }
  }

  private parseRecursive(
    tokens: Token[],
    index: number,
    references: Set<string>,
  ): { node: TypeNode; consumed: number } {
    let i = index
    let currentNode: TypeNode = {
      kind: 'simple',
      name: '',
      fullLabel: '',
      isCollection: false,
    }

    const labelParts: string[] = []

    while (i < tokens.length) {
      const token = tokens[i]

      // --- CASO 1: LITERALES DE OBJETO { x: number } ---
      if (token.type === TokenType.SYMBOL && token.value === '{') {
        currentNode.kind = 'object'
        currentNode.name = 'object-literal'
        currentNode.members = []
        labelParts.push('{')
        i++

        while (
          i < tokens.length &&
          !(tokens[i].type === TokenType.SYMBOL && tokens[i].value === '}')
        ) {
          if (tokens[i].type === TokenType.IDENTIFIER) {
            const memberName = tokens[i].value
            let memberType: TypeNode = {
              kind: 'simple',
              name: 'any',
              fullLabel: 'any',
              isCollection: false,
            }
            i++
            if (tokens[i]?.value === ':') {
              const { node: t, consumed } = this.parseRecursive(tokens, i + 1, references)
              memberType = t
              i += consumed + 1
            }
            currentNode.members.push({ name: memberName, type: memberType })
            labelParts.push(`${memberName}: ${memberType.fullLabel}`)
            if (tokens[i]?.value === ',' || tokens[i]?.value === ';') {
              labelParts.push(tokens[i].value)
              i++
            }
          } else {
            i++
          }
        }
        if (tokens[i]?.value === '}') {
          labelParts.push('}')
          i++
        }
        break // Terminamos de procesar el objeto literal
      }

      // --- CASO 2: LITERALES DE STRING/NUMBER (enums en línea) ---
      if (
        token.type === TokenType.STRING ||
        (token.type === TokenType.KEYWORD && ['true', 'false', 'null'].includes(token.value))
      ) {
        currentNode.kind = 'literal'
        currentNode.literalValue = token.value
        currentNode.name = token.value
        labelParts.push(token.value)
        i++
      }

      // --- CASO 3: IDENTIFICADORES Y GENÉRICOS ---
      else if (token.type === TokenType.IDENTIFIER) {
        currentNode.name = token.value
        references.add(token.value)
        labelParts.push(token.value)
        i++

        if (tokens[i]?.value === '<') {
          currentNode.kind = 'generic'
          labelParts.push('<')
          i++
          const { nodes, consumed } = this.parseTypeParameters(tokens, i, references)
          currentNode.arguments = nodes
          labelParts.push(nodes.map((n) => n.fullLabel).join(', '))
          labelParts.push('>')
          i += consumed
        }
      }

      // --- CASO 4: ARRAYS [] ---
      if (tokens[i]?.value === '[' && tokens[i + 1]?.value === ']') {
        currentNode.isCollection = true
        labelParts.push('[]')
        i += 2
      }

      // --- CASO 5: UNIONES | E INTERSECCIONES & ---
      if (tokens[i]?.value === '|' || tokens[i]?.value === '&') {
        const isUnion = tokens[i].value === '|'
        const leftNode = { ...currentNode, fullLabel: labelParts.join('').trim() }
        const symbol = isUnion ? ' | ' : ' & '
        labelParts.push(symbol)
        i++

        const { node: rightNode, consumed } = this.parseRecursive(tokens, i, references)

        currentNode = {
          kind: isUnion ? 'union' : 'intersection',
          name: isUnion ? 'union' : 'intersection',
          fullLabel: '',
          types: [leftNode, rightNode],
          isCollection: leftNode.isCollection || rightNode.isCollection,
        }

        labelParts.push(rightNode.fullLabel)
        i += consumed
        break
      }

      // Salida si no hay más operadores que procesar
      if (i === index) {
        i++
        break
      }
      const nextVal = tokens[i]?.value
      if (!nextVal || !['<', '[', '|', '&'].includes(nextVal)) break
    }

    currentNode.fullLabel = labelParts.join('').trim()
    return { node: currentNode, consumed: i - index }
  }

  private parseTypeParameters(
    tokens: Token[],
    index: number,
    refs: Set<string>,
  ): { nodes: TypeNode[]; consumed: number } {
    const nodes: TypeNode[] = []
    let i = index
    while (i < tokens.length) {
      const { node, consumed } = this.parseRecursive(tokens, i, refs)
      nodes.push(node)
      i += consumed
      if (tokens[i]?.value === ',') {
        i++
        continue
      }
      if (tokens[i]?.value === '>') {
        i++
        break
      }
      if (i >= tokens.length) break
    }
    return { nodes, consumed: i - index }
  }
}
