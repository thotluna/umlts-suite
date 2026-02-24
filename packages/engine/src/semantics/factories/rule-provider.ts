import type { ValidationEngine } from '@engine/semantics/core/validation-engine'
import type { SymbolTable } from '@engine/semantics/symbol-table'
import { EntityModifierRule } from '@engine/semantics/rules/entity/entity-modifier.rule'
import { InheritanceCycleRule } from '@engine/semantics/rules/diagram/inheritance-cycle.rule'
import { CompositionTargetRule } from '@engine/semantics/rules/relationship/composition-target.rule'
import { PackageTargetRule } from '@engine/semantics/rules/relationship/package-target.rule'
import { GeneralizationRule } from '@engine/semantics/rules/relationship/generalization.rule'

export class UMLRuleProvider {
  public static registerDefaultRules(engine: ValidationEngine, symbolTable: SymbolTable): void {
    engine
      .register(new EntityModifierRule())
      .register(new InheritanceCycleRule(symbolTable))
      .register(new CompositionTargetRule(symbolTable))
      .register(new PackageTargetRule(symbolTable))
      .register(new GeneralizationRule(symbolTable))
  }
}
