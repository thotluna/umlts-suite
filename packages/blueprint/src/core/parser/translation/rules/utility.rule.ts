import { TypeNode } from '../../types'
import { TranslationResult, TypeTranslationRule, TypeTranslator } from '../translator'

export class UtilityRule implements TypeTranslationRule {
  private static readonly UTILITIES = new Set(['Partial', 'Pick', 'Omit'])

  canHandle(info: TypeNode): boolean {
    return info && info.kind === 'generic' && UtilityRule.UTILITIES.has(info.name)
  }

  translate(info: TypeNode, context: TypeTranslator): TranslationResult {
    // Si no hay argumentos, devolvemos el fullLabel
    if (!info.arguments || info.arguments.length === 0) {
      return {
        cleanType: info.fullLabel || info.name,
        multiplicity: '1',
        stereotypes: [],
      }
    }

    // Traducimos todos los argumentos recursivamente (para Omit<User, 'id'>, etc.)
    const args = info.arguments
      .map((arg) => {
        const res = context.translate(arg)
        return res.cleanType
      })
      .join(', ')

    // Construimos la cadena "Partial<User>"
    const cleanType = `${info.name}<${args}>`

    return {
      cleanType,
      multiplicity: '1', // La referencia al objeto es 1. La opcionalidad interna es implícita en el tipo.
      stereotypes: [], // Sin estereotipos en el atributo.
    }
  }
}
