import { UMLAssociation } from './association'

export class UMLAggregation extends UMLAssociation {
  constructor(id: string, from: string, to: string) {
    super(id, from, to)
    this.isAggregation = true
  }

  public override get type(): string {
    return 'Aggregation'
  }
}
