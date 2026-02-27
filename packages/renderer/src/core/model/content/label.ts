import { UMLText } from './text'

/**
 * Specialized text for labels in edges (roles, multiplicity).
 */
export class UMLLabel extends UMLText {
  constructor(id: string, text: string) {
    super(id, text, 11, 'normal')
  }
}
