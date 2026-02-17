import { TypeNode } from '../../types'
import { TranslationResult, TypeTranslationRule, TypeTranslator } from '../translator'

export class UnionRule implements TypeTranslationRule {
  canHandle(info: TypeNode): boolean {
    return !!(info && (info.kind === 'union' || (info.types && info.types.length > 0)))
  }

  translate(info: TypeNode, _context: TypeTranslator): TranslationResult {
    const types = info.types || []

    // CASO 1: Nulabilidad (User | null | undefined)
    const isNullable = types.some((t) => t.name === 'null' || t.name === 'undefined')
    if (isNullable) {
      const nonNullableTypes = types.filter((t) => t.name !== 'null' && t.name !== 'undefined')

      // Si solo queda uno, es un tipo opcional simple: User [0..1]
      if (nonNullableTypes.length === 1) {
        const result = _context.translate(nonNullableTypes[0])
        return {
          ...result,
          multiplicity: '0..1',
        }
      }

      // Si quedan varios (ej: User | Organization | null), es una unión opcional
      return {
        cleanType: 'xor',
        multiplicity: '0..1',
        stereotypes: ['xor'],
      }
    }

    // CASO 2: Polimorfismo / XOR (User | Organization)
    // Según el usuario, para cumplir el estándar, esto debe tratarse como XOR
    // y no pueden compartir el mismo rol si se desglosan en relaciones.
    return {
      cleanType: 'xor',
      multiplicity: '1',
      stereotypes: ['xor'],
    }
  }
}
