import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'
import type { ProfileRegistry } from '@engine/semantics/profiles/profile.registry'
import type { StereotypeApplicationNode, ASTNode } from '@engine/syntax/nodes'
import type { Token } from '@engine/syntax/token.types'
import { TokenType } from '@engine/syntax/token.types'
import { DiagnosticCode } from '@engine/syntax/diagnostic.types'
import { UMLMetaclass } from '@engine/core/metamodel'
import type { IRStereotypeApplication } from '@engine/generator/ir/models'

/**
 * Especializado en validar y resolver aplicaciones de estereotipos.
 */
export class StereotypeAnalyzer {
  constructor(
    private readonly profileRegistry: ProfileRegistry,
    private readonly context: ISemanticContext,
  ) {}

  /**
   * Resuelve y valida una lista de aplicaciones de estereotipos contra una metaclase destino.
   * Retorna una lista de nombres de estereotipos validados (para el IR) y/o reporta errores.
   */
  public process(
    applications: StereotypeApplicationNode[] | undefined,
    targetNode: ASTNode,
  ): IRStereotypeApplication[] {
    if (!applications) return []

    const validStereotypes: IRStereotypeApplication[] = []

    for (const app of applications) {
      const def = this.profileRegistry.getStereotype(app.name)

      if (!def) {
        // Regla: No se reconoce el estereotipo (Inferencia implícita con advertencia)
        this.context.addError(
          `Stereotype '${app.name}' is not defined in any loaded profile.`,
          {
            line: app.line,
            column: app.column,
            type: TokenType.AT,
            value: app.name,
          } as Token,
          DiagnosticCode.SEMANTIC_STEREOTYPE_NOT_FOUND,
        )
        // Aceptamos el nombre de todos modos para representación visual (Prototipado rápido)
        validStereotypes.push({ name: app.name })
        continue
      }

      // 1. Validar Metaclase compatible
      if (!this.isCompatible(def.extends, targetNode.metaclass)) {
        this.context.addError(
          `Stereotype '${app.name}' cannot be applied to ${targetNode.type}. It extends: ${def.extends.join(', ')}`,
          {
            line: app.line,
            column: app.column,
            type: TokenType.AT,
            value: app.name,
          } as Token,
          DiagnosticCode.SEMANTIC_STEREOTYPE_INCOMPATIBLE,
        )
      }

      // 2. Validar Tagged Values (Tipos)
      if (app.values && def.properties) {
        for (const [key, val] of Object.entries(app.values)) {
          const expectedType = def.properties[key]
          if (!expectedType) {
            this.context.addError(
              `Unknown property '${key}' in stereotype '${app.name}'.`,
              {
                line: app.line,
                column: app.column,
                type: TokenType.IDENTIFIER,
                value: key,
              } as Token,
              DiagnosticCode.SEMANTIC_INVALID_TYPE,
            )
            continue
          }

          if (!this.checkTaggedValueType(val, expectedType)) {
            this.context.addError(
              `Property '${key}' in stereotype '${app.name}' expects ${expectedType}, but got ${typeof val}.`,
              {
                line: app.line,
                column: app.column,
                type: TokenType.IDENTIFIER,
                value: key,
              } as Token,
              DiagnosticCode.SEMANTIC_INVALID_TYPE,
            )
          }
        }
      }

      validStereotypes.push({
        name: app.name,
        values: app.values ? { ...app.values } : undefined,
      })
    }

    return validStereotypes
  }

  private isCompatible(allowed: UMLMetaclass[], actual: UMLMetaclass): boolean {
    // Si el estereotipo es 'universal' (extiende la base o no tiene restricciones, aunque UML dice que siempre extiende algo)
    if (allowed.length === 0) return true

    // Check direct compatibility or hierarchy
    return allowed.some((a) => this.metaclassExtends(actual, a))
  }

  private metaclassExtends(actual: UMLMetaclass, allowed: UMLMetaclass): boolean {
    if (actual === allowed) return true

    // Jerarquía simple de metaclases para validación básica
    const hierarchy: Partial<Record<UMLMetaclass, UMLMetaclass[]>> = {
      [UMLMetaclass.CLASS]: [UMLMetaclass.CLASSIFIER, UMLMetaclass.TYPE],
      [UMLMetaclass.INTERFACE]: [UMLMetaclass.CLASSIFIER, UMLMetaclass.TYPE],
      [UMLMetaclass.SIGNAL]: [UMLMetaclass.CLASSIFIER, UMLMetaclass.TYPE],
      [UMLMetaclass.ENUMERATION]: [UMLMetaclass.CLASSIFIER, UMLMetaclass.TYPE],
      [UMLMetaclass.DATA_TYPE]: [UMLMetaclass.CLASSIFIER, UMLMetaclass.TYPE],
      [UMLMetaclass.ASSOCIATION_CLASS]: [UMLMetaclass.CLASS, UMLMetaclass.ASSOCIATION],
      [UMLMetaclass.ASSOCIATION]: [UMLMetaclass.RELATIONSHIP],
      [UMLMetaclass.USAGE]: [UMLMetaclass.DEPENDENCY],
      [UMLMetaclass.DEPENDENCY]: [UMLMetaclass.RELATIONSHIP],
      [UMLMetaclass.OPERATION]: [UMLMetaclass.ELEMENT],
      [UMLMetaclass.CLASSIFIER]: [UMLMetaclass.NAMESPACE],
    }

    const parents = hierarchy[actual] || []
    return parents.some((p) => this.metaclassExtends(p, allowed))
  }

  private checkTaggedValueType(value: unknown, expected: string): boolean {
    switch (expected) {
      case 'String':
        return typeof value === 'string'
      case 'Integer':
        return Number.isInteger(value)
      case 'Float':
        return typeof value === 'number'
      case 'Boolean':
        return typeof value === 'boolean'
      default:
        return false
    }
  }
}
