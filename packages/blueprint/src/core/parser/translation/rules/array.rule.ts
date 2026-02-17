import { TypeNode } from '../../types'
import { TranslationResult, TypeTranslationRule, TypeTranslator } from '../translator'

export class ArrayRule implements TypeTranslationRule {
  canHandle(info: TypeNode): boolean {
    return info.kind === 'array' || info.fullLabel.endsWith('[]') || info.name === 'Array'
  }

  translate(info: TypeNode, _context: TypeTranslator): TranslationResult {
    let baseType = 'any'

    if (info.fullLabel.endsWith('[]')) {
      baseType = info.fullLabel.replace(/\[\]$/, '')
    } else if (info.name === 'Array' && info.arguments?.length) {
      baseType = info.arguments[0].fullLabel
    } else {
      baseType = info.name
    }

    return {
      cleanType: baseType,
      multiplicity: '*',
      stereotypes: [],
    }
  }
}
