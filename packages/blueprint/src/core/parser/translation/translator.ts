import { TypeNode } from '../types'
import { UnionRule } from './rules/union.rule'
import { ArrayRule } from './rules/array.rule'
import { UtilityRule } from './rules/utility.rule'

export interface TranslationResult {
  cleanType: string
  multiplicity: string
  stereotypes: string[]
}

export interface TypeTranslationRule {
  /**
   * Determina si esta regla puede manejar el tipo dado.
   */
  canHandle(info: TypeNode): boolean

  /**
   * Traduce el tipo de TS a UMLTS.
   */
  translate(info: TypeNode, context: TypeTranslator): TranslationResult
}

export class TypeTranslator {
  private rules: TypeTranslationRule[] = []

  constructor() {
    // El orden importa: las reglas más específicas primero
    this.registerRule(new UnionRule())
    this.registerRule(new UtilityRule())
    this.registerRule(new ArrayRule())
  }

  public registerRule(rule: TypeTranslationRule) {
    this.rules.push(rule)
  }

  public translate(info: TypeNode): TranslationResult {
    for (const rule of this.rules) {
      if (rule.canHandle(info)) {
        return rule.translate(info, this)
      }
    }

    // Traducción por defecto (Fallback)
    return {
      cleanType: info.fullLabel || info.name,
      multiplicity: info.isCollection ? '*' : '1',
      stereotypes: [],
    }
  }
}
