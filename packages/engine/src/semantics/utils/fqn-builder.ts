/**
 * Utility for building and normalizing Fully Qualified Names (FQNs).
 */
export class FQNBuilder {
  /**
   * Builds a normalized FQN.
   * If the name is already an absolute FQN, it returns it as is.
   * Otherwise, it prefixes it with the current namespace.
   *
   * @param name - The name or partial FQN.
   * @param namespace - The current context namespace.
   * @returns The normalized absolute FQN.
   */
  public static build(name: string, namespace: string): string {
    const trimmedName = name.trim()

    // 1. If it's already an absolute name (starts with a dot or is already known)
    // For now, we assume if it contains a dot and doesn't match the current namespace start,
    // or if the user explicitly wants to treat it as absolute.
    // In our DSL, if it contains a dot, it's often intended as an absolute or semi-absolute path.
    // However, a common pattern is to check if the first segment is a known top-level package.

    // For simplicity and following common compiler patterns:
    // If it starts with '.', it's absolute.
    if (trimmedName.startsWith('.')) {
      return trimmedName.substring(1)
    }

    // 2. If no namespace provided, return name
    if (!namespace) {
      return trimmedName
    }

    // 3. If the name already contains the namespace as a prefix, return as is
    if (trimmedName.startsWith(namespace + '.')) {
      return trimmedName
    }

    return `${namespace}.${trimmedName}`
  }

  /**
   * Extracts the short name and namespace from an FQN.
   */
  public static split(fqn: string): { namespace?: string; name: string } {
    let lastDotIndex = -1
    let depth = 0

    for (let i = 0; i < fqn.length; i++) {
      if (fqn[i] === '<') depth++
      else if (fqn[i] === '>') depth--
      else if (fqn[i] === '.' && depth === 0) {
        lastDotIndex = i
      }
    }

    if (lastDotIndex === -1) {
      return { name: fqn }
    }

    return {
      namespace: fqn.substring(0, lastDotIndex),
      name: fqn.substring(lastDotIndex + 1),
    }
  }
}
