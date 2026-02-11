
import {
  IR,
  IREntity,
  IRMember,
  IRRelationship,
  DiagramModel,
  DiagramNode,
  DiagramEdge,
  DiagramPackage
} from './types';
import { normalizeMultiplicity } from '../utils/multiplicity';

/**
 * IRAdapter: Transforms the raw IR from ts-uml-engine into a DiagramModel
 * suitable for layout and rendering.
 */
export class IRAdapter {

  /**
   * Transforms a full IR into a DiagramModel.
   */
  public transform(ir: IR): DiagramModel {
    const nodes = ir.entities.map(entity => this.transformEntity(entity));
    const edges = ir.relationships.map(rel => this.transformRelationship(rel));
    const packages = this.buildPackageHierarchy(nodes);

    return {
      nodes,
      edges,
      packages
    };
  }

  /**
   * Transforms a single IREntity into a DiagramNode.
   */
  private transformEntity(entity: IREntity): DiagramNode {
    const attributes: IRMember[] = [];
    const methods: IRMember[] = [];

    // Discriminate between attributes and methods
    for (const member of entity.members) {
      const normalizedMember = {
        ...member,
        multiplicity: normalizeMultiplicity(member.multiplicity)
      };

      if (member.parameters !== undefined) {
        methods.push(normalizedMember);
      } else {
        attributes.push(normalizedMember);
      }
    }

    return {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      attributes,
      methods,
      isImplicit: entity.isImplicit,
      isAbstract: entity.isAbstract,
      isStatic: entity.isStatic,
      isActive: entity.isActive,
      namespace: entity.namespace,
      typeParameters: entity.typeParameters || [],
      docs: entity.docs
    };
  }

  /**
   * Transforms a single IRRelationship into a DiagramEdge.
   */
  private transformRelationship(rel: IRRelationship): DiagramEdge {
    return {
      from: rel.from,
      to: rel.to,
      type: rel.type,
      label: rel.label,
      visibility: rel.visibility,
      fromMultiplicity: normalizeMultiplicity(rel.fromMultiplicity),
      toMultiplicity: normalizeMultiplicity(rel.toMultiplicity)
    };
  }

  /**
   * Builds a tree structure of packages based on entity namespaces/IDs.
   */
  private buildPackageHierarchy(nodes: DiagramNode[]): DiagramPackage[] {
    const root: DiagramPackage = { name: '', children: [] };
    const packageMap: Map<string, DiagramPackage> = new Map();

    for (const node of nodes) {
      if (!node.namespace) continue;

      const parts = this.splitNamespace(node.namespace);
      let currentPath = '';
      let currentPkg = root;

      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}.${part}` : part;
        let pkg = packageMap.get(currentPath);

        if (!pkg) {
          pkg = {
            id: currentPath,
            name: part,
            children: []
          };
          packageMap.set(currentPath, pkg);
          currentPkg.children.push(pkg);
        }
        currentPkg = pkg;
      }

      currentPkg.children.push(node);
    }

    // Return the children of the virtual root (only the actual top-level packages)
    return root.children.filter((c): c is DiagramPackage => 'children' in c);
  }

  private splitNamespace(ns: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < ns.length; i++) {
      if (ns[i] === '<') depth++;
      else if (ns[i] === '>') depth--;

      if (ns[i] === '.' && depth === 0) {
        if (current) parts.push(current);
        current = '';
      } else {
        current += ns[i];
      }
    }
    if (current) parts.push(current);
    return parts;
  }
}
