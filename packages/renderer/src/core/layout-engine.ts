import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import { DiagramModel, LayoutResult, DiagramNode, DiagramEdge, DiagramPackage } from './types';
import { measureNode, measureText } from '../utils/measure';

const elk = new ELK();

// ─── ELK option keys ──────────────────────────────────────────────────────────
// ELK requires the FULL qualified key (with "elk." prefix) at every level.
// Omitting the prefix is one of the most common silent-fail causes.

const ROOT_LAYOUT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'UP',        // inheritance goes UP (child → parent)

  // Node/layer spacing — sensible defaults for class diagrams
  'elk.spacing.nodeNode': '60',
  'elk.spacing.nodeNodeBetweenLayers': '300',
  'elk.layered.spacing.baseValue': '50',

  // Edge routing
  'elk.edgeRouting': 'ORTHOGONAL',

  // Node placement: BRANDES_KOEPF produces compact, readable results
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',

  // Reduce edge crossings
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',

  // Keep edges close to their nodes (better for UML)
  'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',

  // Edge labels configuration
  'elk.edgeLabels.placement': 'CENTER',
  'elk.edgeLabels.sideSelection': 'ALWAYS_UP',
  'elk.edgeLabels.spacing': '30',
  'elk.layered.spacing.edgeLabel': '40',

  // Outer padding
  'elk.padding': '[top=50,left=50,bottom=50,right=50]',

  // Hierarchical edges handling
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
};

const PACKAGE_LAYOUT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'UP',
  'elk.spacing.nodeNode': '50',
  'elk.spacing.nodeNodeBetweenLayers': '70',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.padding': '[top=50,left=20,bottom=20,right=20]',
};

/**
 * LayoutEngine: Uses ELK.js to calculate positions and routing for the diagram elements.
 */
export class LayoutEngine {

  /**
   * Performs the layout calculation.
   */
  public async layout(model: DiagramModel): Promise<LayoutResult> {
    // Collect all node IDs that live inside packages so we don't add them twice
    const nodesInPackages = new Set<string>();
    this.collectPackageNodeIds(model.packages, nodesInPackages);

    const elkGraph: ElkNode = {
      id: 'root',
      layoutOptions: ROOT_LAYOUT_OPTIONS,
      children: [
        ...model.packages.map(pkg => this.pkgToElk(pkg)),
        ...model.nodes
          .filter(node => !nodesInPackages.has(node.id))
          .map(node => this.toElkNode(node)),
      ],
      // IMPORTANT: only top-level edges go here.
      // Edges between nodes inside the same package go inside that package node.
      edges: this.buildTopLevelEdges(model),
    };

    const layoutedGraph = await elk.layout(elkGraph);

    this.applyLayout(model, layoutedGraph);

    return {
      model,
      totalWidth: layoutedGraph.width ?? 800,
      totalHeight: layoutedGraph.height ?? 600,
    };
  }

  // ── ELK graph builders ────────────────────────────────────────────────────

  private pkgToElk(pkg: DiagramPackage): ElkNode {
    return {
      id: `pkg:${pkg.id ?? pkg.name}`,
      layoutOptions: PACKAGE_LAYOUT_OPTIONS,
      children: pkg.children.map(child =>
        'children' in child ? this.pkgToElk(child) : this.toElkNode(child)
      ),
      // Edges whose both endpoints are inside this package belong here
      edges: [], // populated in buildTopLevelEdges if needed (see note below)
    };
  }

  private toElkNode(node: DiagramNode): ElkNode {
    const { width, height } = measureNode(node);
    return { id: node.id, width, height };
  }

  /**
   * Builds the edge list for the root graph.
   *
   * ELK rule: an edge must be declared at the level of the LOWEST COMMON
   * ANCESTOR of its source and target nodes. For simplicity (and because
   * cross-package edges are the norm in class diagrams) we place ALL edges at
   * the root level. ELK handles cross-hierarchy edges correctly when declared
   * at the root.
   */
  private buildTopLevelEdges(model: DiagramModel): ElkExtendedEdge[] {
    return model.edges.map((edge, index) => {
      const elkEdge: ElkExtendedEdge = {
        id: `e${index}`,
        sources: [edge.from],
        targets: [edge.to],
      };

      if (edge.label) {
        // Estimate label size
        const { width, height } = measureText(edge.label, 11); // theme uses small font
        elkEdge.labels = [{
          id: `l${index}`,
          text: edge.label,
          width,
          height
        }];
      }

      return elkEdge;
    });
  }

  // ── Layout application ────────────────────────────────────────────────────

  private applyLayout(model: DiagramModel, layoutedGraph: ElkNode): void {
    const elkNodes = layoutedGraph.children ?? [];
    const elkEdges = layoutedGraph.edges ?? [];

    this.processElkNodes(elkNodes, model, 0, 0);
    this.processElkEdges(layoutedGraph, model);
  }

  /**
   * Recursively maps ELK node positions back to our DiagramModel.
   * offsetX/Y accumulate the parent's absolute position so that child
   * positions (which ELK gives as relative to their parent) become absolute.
   */
  private processElkNodes(
    elkNodes: ElkNode[],
    model: DiagramModel,
    offsetX: number,
    offsetY: number,
  ): void {
    for (const elkNode of elkNodes) {
      const absX = (elkNode.x ?? 0) + offsetX;
      const absY = (elkNode.y ?? 0) + offsetY;

      if (elkNode.id.startsWith('pkg:')) {
        const pkgId = elkNode.id.slice('pkg:'.length);
        const pkg = this.findPackage(model.packages, pkgId);
        if (pkg) {
          pkg.x = absX;
          pkg.y = absY;
          pkg.width = elkNode.width;
          pkg.height = elkNode.height;

          if (elkNode.children?.length) {
            this.processElkNodes(elkNode.children, model, absX, absY);
          }
        }
      } else {
        const node = model.nodes.find(n => n.id === elkNode.id);
        if (node) {
          node.x = absX;
          node.y = absY;
          node.width = elkNode.width;
          node.height = elkNode.height;
        }
      }
    }
  }

  /**
   * Maps ELK edge sections (waypoints) back to DiagramEdge.
   * Logic: ELK returns coordinates relative to the node that contains the edge.
   * Since we put all edges at the root, they should be relative to the root (0,0).
   * HOWEVER, if ELK moves an edge inside a package during layout or if we change
   * where edges are declared, we need to be robust.
   */
  private processElkEdges(root: ElkNode, model: DiagramModel): void {
    const allEdges = this.collectAllElkEdges(root);

    for (const elkEdge of allEdges) {
      if (!elkEdge.id?.startsWith('e')) continue;

      const edgeIndex = parseInt(elkEdge.id.slice(1), 10);
      const edge = model.edges[edgeIndex];
      if (!edge) continue;

      // Find the absolute offset of the container where this edge lives
      const offset = this.getElkEdgeOffset(root, elkEdge.id);

      const sections = (elkEdge as any).sections;
      if (!sections?.length) continue;

      const section = sections[0];
      const waypoints: { x: number; y: number }[] = [];

      waypoints.push({
        x: section.startPoint.x + offset.x,
        y: section.startPoint.y + offset.y
      });

      for (const bp of section.bendPoints ?? []) {
        waypoints.push({
          x: bp.x + offset.x,
          y: bp.y + offset.y
        });
      }

      waypoints.push({
        x: section.endPoint.x + offset.x,
        y: section.endPoint.y + offset.y
      });

      edge.waypoints = waypoints;

      if (elkEdge.labels?.[0]) {
        edge.labelPos = {
          x: (elkEdge.labels[0].x ?? 0) + offset.x,
          y: (elkEdge.labels[0].y ?? 0) + offset.y
        };
        edge.labelWidth = elkEdge.labels[0].width;
        edge.labelHeight = elkEdge.labels[0].height;
      }
    }
  }

  /** Recursively collects all edges from the ELK graph. */
  private collectAllElkEdges(node: ElkNode): ElkExtendedEdge[] {
    let edges = node.edges || [];
    for (const child of node.children || []) {
      edges = edges.concat(this.collectAllElkEdges(child));
    }
    return edges;
  }

  /** Finds the absolute offset (x, y) of the node that owns the given edge ID. */
  private getElkEdgeOffset(node: ElkNode, edgeId: string, currentX = 0, currentY = 0): { x: number; y: number } {
    if (node.edges?.some(e => e.id === edgeId)) {
      return { x: currentX, y: currentY };
    }

    for (const child of node.children || []) {
      const found = this.getElkEdgeOffset(child, edgeId, currentX + (child.x ?? 0), currentY + (child.y ?? 0));
      if (found.x !== -1) return found;
    }

    return { x: -1, y: -1 };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Collects all node IDs that are nested inside any package (recursively). */
  private collectPackageNodeIds(packages: DiagramPackage[], out: Set<string>): void {
    for (const pkg of packages) {
      for (const child of pkg.children) {
        if ('children' in child) {
          this.collectPackageNodeIds([child], out);
        } else {
          out.add(child.id);
        }
      }
    }
  }

  private findPackage(packages: DiagramPackage[], id: string): DiagramPackage | undefined {
    for (const pkg of packages) {
      if (pkg.id === id || pkg.name === id) return pkg;
      const nested = pkg.children.filter((c): c is DiagramPackage => 'children' in c);
      const found = this.findPackage(nested, id);
      if (found) return found;
    }
    return undefined;
  }
}