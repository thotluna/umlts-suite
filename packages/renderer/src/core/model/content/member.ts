import { UMLText } from './text'
import { type IRMultiplicity, type IRParameter } from '@umlts/engine'
import { type UMLConstraintArc } from '../connectors/constraint-arc'

export class UMLMember extends UMLText {
  public isDerived = false
  public visibility = 'public'
  public type?: string
  public multiplicity?: string | IRMultiplicity
  public isLeaf = false
  public isAbstract = false
  public isStatic = false
  public parameters?: IRParameter[]
  public returnType?: string
  public returnMultiplicity?: string | IRMultiplicity
  public hideConstraints = false
  public constraints: UMLConstraintArc[] = []

  constructor(id: string, text: string) {
    super(id, text, 12, 'normal')
  }

  /**
   * Polymorphic text representation including UML prefixes, parameters and types.
   */
  public getFullText(): string {
    const prefix = this.isDerived ? '/' : ''
    const visSign = this.getVisibilitySign()
    let full = `${visSign} ${prefix}${this.text}`

    // Add parameters if it's an operation (parameters is defined)
    if (this.parameters) {
      const params = this.parameters
        .map((p) => `${p.name}: ${p.type}${p.multiplicity ? p.multiplicity : ''}`)
        .join(', ')
      full += `(${params})`
    }

    // Add return type or property type
    const type = this.returnType || this.type
    if (type) {
      full += `: ${type}`
    }

    return full
  }

  private getVisibilitySign(): string {
    switch (this.visibility) {
      case 'private':
        return '-'
      case 'protected':
        return '#'
      case 'package':
        return '~'
      default:
        return '+' // public
    }
  }
}
