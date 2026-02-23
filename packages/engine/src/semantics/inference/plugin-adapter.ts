import type { TypeNode } from '@engine/syntax/nodes'
import type { PluginManager } from '@engine/plugins/plugin-manager'
import type {
  ITypeResolutionStrategy,
  TypeResolution,
} from '@engine/semantics/inference/type-resolution.pipeline'
import { TypeValidator } from '@engine/semantics/utils/type-validator'

/**
 * Adapts the active LanguagePlugin to the ITypeResolutionStrategy interface.
 * Allows the TypeResolutionPipeline to transparently use plugins for type resolution.
 */
export class PluginTypeResolutionAdapter implements ITypeResolutionStrategy {
  constructor(private readonly pluginManager: PluginManager) {}

  public resolve(typeNode: TypeNode): TypeResolution | null {
    const plugin = this.pluginManager.getActive()
    if (!plugin) return null

    // 1. Try resolving using the plugin's resolveType method (complex types)
    const mapping = plugin.resolveType(typeNode)
    if (mapping) {
      return {
        targetName: mapping.targetName,
        multiplicity: mapping.multiplicity,
        relationshipType: mapping.relationshipType,
        label: mapping.label,
        isIgnored: mapping.isIgnored,
      }
    }

    // 2. Try mapping primitive types via the plugin
    // If the type is simple (no generics), check mapPrimitive
    if (typeNode.kind === 'simple') {
      const mappedPrimitive = plugin.mapPrimitive(typeNode.name)
      if (mappedPrimitive) {
        // If it maps to a primitive, we consider it "resolved" but implementation details might vary.
        // For the pipeline, we return null to let the next strategy (UMLTypeResolver) handle the result
        // if the result is a UML Primitive (e.g. 'number' -> 'Real').
        // BUT, if we return null, the MemberInference will fallback.
        // The previous logic replaced the name and then checked isPrimitive.
        // Strategy: If it maps to a UML primitive, we return the mapped name as targetName
        // and let the caller decide what to do (usually ignore relation).
        // However, MemberInference logic is: if pipeline returns resolution -> implicit relation.
        // If pipeline returns null -> check primitive.
        // If it's a primitive, we should probably NOT return a resolution that creates a relation,
        // unless we want to link to a "primitive" entity (which we usually don't).
        // If mapPrimitive returns something, it effectively means "it is a primitive in this language".
        // So we return null here so that isPrimitive check can pass later??
        // No, ITypeResolutionStrategy.isPrimitive needs to handle this.
      }
    }

    return null
  }

  public isPrimitive(typeName: string): boolean {
    const plugin = this.pluginManager.getActive()
    if (!plugin) return false

    // Check if the plugin considers this a primitive mapping
    const baseName = TypeValidator.getBaseTypeName(typeName)
    const mapped = plugin.mapPrimitive(baseName)

    // If it maps to something (e.g. number -> Real), it IS a primitive for this language context
    return mapped !== null
  }
}
