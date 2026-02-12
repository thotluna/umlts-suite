import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import { DiagramModel, UMLNode, UMLEdge, UMLPackage, LayoutResult, DiagramConfig } from '../core/types';
import { measureText } from './measure';

const elk = new ELK();

// ─── ELK option keys ──────────────────────────────────────────────────────────
// ELK requires the FULL qualified key (with "elk." prefix) at every level.
// Omitting the prefix is one of the most common silent-fail causes.
//
// NOTE: Using minimal options to avoid ELK.js bug with cross-package edges.
// Complex layout options (advanced placement strategies, edge label configs, etc.)
// cause "Cannot read properties of undefined" errors when edges connect nodes
// in different packages. We keep only essential spacing and padding.

const BASE_LAYOUT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',

  // Basic spacing for readability
  'elk.spacing.nodeNode': '80',
  'elk.padding': '[top=60,left=60,bottom=60,right=60]',
};

/**
 * LayoutEngine: Uses ELK.js to calculate positions and routing for the diagram elements.
 */
export class LayoutEngine {

  public async layout(model: DiagramModel, config?: DiagramConfig['layout']): Promise<LayoutResult> {
    const edgesByLCA = this.groupEdgesByLCA(model);

    // Prepare layout options based on configuration
    const layoutOptions: any = { ...BASE_LAYOUT_OPTIONS };

    if (config?.direction) {
      layoutOptions['elk.direction'] = config.direction;
    }

    if (config?.spacing) {
      layoutOptions['elk.spacing.nodeNode'] = config.spacing.toString();
    }

    if (config?.nodePadding) {
      const p = config.nodePadding;
      layoutOptions['elk.padding'] = `[top=${p},left=${p},bottom=${p},right=${p}]`;
    }

    // 1. Convert to ELK format recursively
    // Nodes that are not part of any package (i.e., top-level nodes)
    const topLevelNodes = model.nodes.filter(n => !n.namespace);

    const elkChildren: ElkNode[] = [
      ...topLevelNodes.map(n => this.toElkNode(n)),
      ...model.packages.map(p => this.pkgToElk(p, edgesByLCA, layoutOptions))
    ];

    const elkGraph: ElkNode = {
      id: 'root',
      layoutOptions,
      children: elkChildren,
      edges: edgesByLCA.get('root') ?? [],
    };

    // Validate graph before sending to ELK
    this.validateElkGraph(elkGraph);

    const layoutedGraph = await elk.layout(elkGraph);

    this.applyLayout(model, layoutedGraph);

    return {
      model,
      totalWidth: layoutedGraph.width ?? 800,
      totalHeight: layoutedGraph.height ?? 600,
    };
  }

  // ── ELK graph builders ────────────────────────────────────────────────────

  /**
   * Converts a DiagramPackage to an ElkNode.
   */
  private pkgToElk(pkg: UMLPackage, edgesByLCA: Map<string, ElkExtendedEdge[]>, layoutOptions: any): ElkNode {
    const pkgId = pkg.id || pkg.name;
    const children: ElkNode[] = pkg.children.map(child => {
      if (child instanceof UMLPackage) {
        return this.pkgToElk(child, edgesByLCA, layoutOptions);
      }
      return this.toElkNode(child as UMLNode);
    });

    return {
      id: pkgId,
      layoutOptions,
      children: children,
      edges: edgesByLCA.get(pkgId) ?? [],
    };
  }

  private toElkNode(node: UMLNode): ElkNode {
    const { width, height } = node.getDimensions();
    return { id: node.id, width, height };
  }

  /**
   * Groups edges by the ID of the package that is their Lowest Common Ancestor.
   * Cross-package edges with no common parent package go to 'root'.
   */
  private groupEdgesByLCA(model: DiagramModel): Map<string, ElkExtendedEdge[]> {
    const groups = new Map<string, ElkExtendedEdge[]>();

    model.edges.forEach((edge, index) => {
      const lcaId = this.findLCA(edge.from, edge.to);
      const elkEdge: ElkExtendedEdge = {
        id: `e${index}`,
        sources: [edge.from],
        targets: [edge.to],
      };

      if (edge.label) {
        const { width, height } = measureText(edge.label, 11);
        elkEdge.labels = [{
          id: `l${index}`,
          text: edge.label,
          width,
          height
        }];
      }

      if (!groups.has(lcaId)) groups.set(lcaId, []);
      groups.get(lcaId)!.push(elkEdge);
    });

    return groups;
  }

  /**
   * Finds the common package ID for two node IDs.
   * Assumes IDs are FQN separated by dots.
   */
  private findLCA(id1: string, id2: string): string {
    const p1 = id1.split('.');
    const p2 = id2.split('.');

    // We want the common prefix excluding the last part (the class name)
    const common: string[] = [];
    const len = Math.min(p1.length - 1, p2.length - 1);

    for (let i = 0; i < len; i++) {
      if (p1[i] === p2[i]) {
        common.push(p1[i]!);
      } else {
        break;
      }
    }

    return common.length > 0 ? common.join('.') : 'root';
  }

  // ── Layout application ────────────────────────────────────────────────────

  private applyLayout(model: DiagramModel, layoutedGraph: ElkNode): void {
    this.processElkNodes(layoutedGraph.children || [], model, 0, 0);
    this.processElkEdges(layoutedGraph, model, 0, 0);
  }

  /**
   * Maps ELK coordinates back to our model.
   */
  private processElkNodes(elkNodes: ElkNode[], model: DiagramModel, offsetX: number, offsetY: number): void {
    const nodesById = new Map<string, UMLNode>(model.nodes.map(n => [n.id, n]));
    const pkgsById = new Map<string, UMLPackage>();

    const collectPkgs = (pkgs: UMLPackage[]) => {
      for (const p of pkgs) {
        if (p.id) pkgsById.set(p.id, p);
        collectPkgs(p.children.filter((c): c is UMLPackage => c instanceof UMLPackage));
      }
    };
    collectPkgs(model.packages);

    for (const elkNode of elkNodes) {
      const node = nodesById.get(elkNode.id);
      const pkg = pkgsById.get(elkNode.id);

      if (node) {
        node.updateLayout(
          (elkNode.x || 0) + offsetX,
          (elkNode.y || 0) + offsetY,
          elkNode.width || 0,
          elkNode.height || 0
        );
      } else if (pkg) {
        pkg.updateLayout(
          (elkNode.x || 0) + offsetX,
          (elkNode.y || 0) + offsetY,
          elkNode.width || 0,
          elkNode.height || 0
        );
        // Recursive for children
        this.processElkNodes(elkNode.children || [], model, (elkNode.x || 0) + offsetX, (elkNode.y || 0) + offsetY);
      }
    }
  }

  /**
   * Maps ELK waypoints back to our model.
   * Edges are relative to their immediate container ELK node.
   */
  private processElkEdges(container: ElkNode, model: DiagramModel, offsetX: number, offsetY: number): void {
    const edgesByEntities = new Map<string, UMLEdge>(
      model.edges.map(e => [`${e.from}->${e.to}`, e])
    );

    if (container.edges) {
      for (const elkEdge of container.edges) {
        const edgeKey = `${elkEdge.sources[0]}->${elkEdge.targets[0]}`;
        const edge = edgesByEntities.get(edgeKey);

        if (edge && elkEdge.sections && elkEdge.sections[0]) {
          const section = elkEdge.sections[0];
          const waypoints: { x: number, y: number }[] = [];

          // Start Point
          waypoints.push({
            x: section.startPoint.x + offsetX,
            y: section.startPoint.y + offsetY
          });

          // Bend Points
          if (section.bendPoints) {
            for (const bp of section.bendPoints) {
              waypoints.push({
                x: bp.x + offsetX,
                y: bp.y + offsetY
              });
            }
          }

          // End Point
          waypoints.push({
            x: section.endPoint.x + offsetX,
            y: section.endPoint.y + offsetY
          });

          // Label Position
          let labelPos;
          let labelWidth;
          let labelHeight;

          if (elkEdge.labels && elkEdge.labels[0]) {
            const l = elkEdge.labels[0];
            labelPos = { x: (l.x || 0) + offsetX, y: (l.y || 0) + offsetY };
            labelWidth = l.width;
            labelHeight = l.height;
          }

          edge.updateLayout(waypoints, labelPos, labelWidth, labelHeight);
        }
      }
    }

    // Recursively process edges in sub-packages
    for (const child of container.children || []) {
      // Offset for sub-container is its absolute position
      this.processElkEdges(child, model, offsetX + (child.x || 0), offsetY + (child.y || 0));
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private findPackage(packages: UMLPackage[], id: string): UMLPackage | undefined {
    for (const pkg of packages) {
      if (pkg.id === id) return pkg;
      const nested = pkg.children.filter((c): c is UMLPackage => c instanceof UMLPackage);
      const found = this.findPackage(nested, id);
      if (found) return found;
    }
    return undefined;
  }

  /**
   * Validates the ELK graph structure to catch common issues before layout.
   */
  private validateElkGraph(node: ElkNode, path: string = 'root'): void {
    // Check node has ID
    if (!node.id) {
      console.error(`[ELK Validation] Node at ${path} has no ID!`);
    }

    // Check children have width/height
    if (node.children) {
      node.children.forEach((child, idx) => {
        const childPath = `${path}.children[${idx}]`;

        // If it's a leaf node (no children), it must have width/height
        if (!child.children || child.children.length === 0) {
          if (child.width === undefined || child.height === undefined) {
            console.error(`[ELK Validation] Leaf node ${child.id} at ${childPath} missing width/height!`);
          }
        }

        // Recursively validate children
        this.validateElkGraph(child, childPath);
      });
    }

    // Check edges reference valid nodes
    if (node.edges) {
      const allNodeIds = this.collectAllElkNodeIds(node);

      node.edges.forEach((edge, idx) => {
        if (!edge.sources || edge.sources.length === 0) {
          console.error(`[ELK Validation] Edge ${edge.id} at ${path}.edges[${idx}] has no sources!`);
        }
        if (!edge.targets || edge.targets.length === 0) {
          console.error(`[ELK Validation] Edge ${edge.id} at ${path}.edges[${idx}] has no targets!`);
        }

        edge.sources?.forEach(sourceId => {
          if (!allNodeIds.has(sourceId)) {
            console.error(`[ELK Validation] Edge ${edge.id} references unknown source: ${sourceId}`);
            console.error(`[ELK Validation] Available nodes:`, Array.from(allNodeIds));
          }
        });

        edge.targets?.forEach(targetId => {
          if (!allNodeIds.has(targetId)) {
            console.error(`[ELK Validation] Edge ${edge.id} references unknown target: ${targetId}`);
            console.error(`[ELK Validation] Available nodes:`, Array.from(allNodeIds));
          }
        });
      });
    }
  }

  /**
   * Collects all node IDs recursively from an ELK graph.
   */
  private collectAllElkNodeIds(node: ElkNode): Set<string> {
    const ids = new Set<string>();

    if (node.id) {
      ids.add(node.id);
    }

    if (node.children) {
      node.children.forEach(child => {
        const childIds = this.collectAllElkNodeIds(child);
        childIds.forEach(id => ids.add(id));
      });
    }

    return ids;
  }
}