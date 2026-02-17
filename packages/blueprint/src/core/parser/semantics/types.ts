export enum RelationshipKind {
  ASSOCIATION = 'ASSOCIATION', // user: User
  AGGREGATION = 'AGGREGATION', // users: User[]
  COMPOSITION = 'COMPOSITION', // config: { ... }
  INHERITANCE = 'INHERITANCE', // extends Base
  REALIZATION = 'REALIZATION', // implements Interface
  DEPENDENCY = 'DEPENDENCY', // execute(user: User)
  REFINEMENT = 'REFINEMENT', // type A = Omit<B, 'x'>
}

export interface SemanticRelationship {
  source: string
  target: string
  kind: RelationshipKind
  multiplicity: '1' | '0..1' | '0..*' | '*'
  stereotype?: string
  xorGroup?: string
  label?: string
}

export interface SemanticAnalysisResult {
  entities: string[] // Entidades implicadas
  relationships: SemanticRelationship[]
  isXor: boolean
}
