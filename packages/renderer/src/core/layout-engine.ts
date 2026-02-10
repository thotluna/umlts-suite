import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import { DiagramModel, LayoutResult, DiagramNode, DiagramEdge, DiagramPackage } from './types';
import { measureNode } from '../utils/measure';

const elk = new ELK();

/**
 * LayoutEngine: Uses ELK.js to calculate positions and routing for the diagram elements.
 */
export class LayoutEngine {

  /**
   * Performs the layout calculation.
   */
  public async layout(model: DiagramModel): Promise<LayoutResult> {
    const elkGraph: ElkNode = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.spacing.nodeNode': '60',
        'elk.layered.spacing.nodeNodeLayered': '60',
        'elk.padding': '[top=50,left=50,bottom=50,right=50]',
        'elk.edges.routing': 'ORTHOGONAL',
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN'
      },
      children: [
        ...model.packages.map(pkg => this.pkgToElk(pkg)),
        ...model.nodes
          .filter(node => !this.isNodeInPackages(node, model.packages))
          .map(node => this.toElkNode(node))
      ],
      edges: model.edges.map((edge, index) => this.toElkEdge(edge, index))
    };

    // ELK calculation
    const layoutedGraph = await elk.layout(elkGraph);

    // Map results back to our model (recursive)
    this.applyLayout(model, layoutedGraph);

    return {
      model,
      totalWidth: layoutedGraph.width || 0,
      totalHeight: layoutedGraph.height || 0
    };
  }

  private pkgToElk(pkg: DiagramPackage): ElkNode {
    return {
      id: `pkg:${pkg.id || pkg.name}`,
      layoutOptions: {
        'elk.padding': '[top=40,left=20,bottom=20,right=20]',
        'elk.spacing.nodeNode': '40'
      },
      children: pkg.children.map(child => {
        if ('children' in child) return this.pkgToElk(child);
        return this.toElkNode(child);
      })
    };
  }

  private toElkNode(node: DiagramNode): ElkNode {
    const { width, height } = measureNode(node);
    return {
      id: node.id,
      width,
      height
    };
  }

  private toElkEdge(edge: DiagramEdge, index: number): ElkExtendedEdge {
    return {
      id: `e${index}`,
      sources: [edge.from],
      targets: [edge.to]
    };
  }

  private applyLayout(model: DiagramModel, layoutedGraph: ElkNode): void {
    const elkNodes = layoutedGraph.children || [];
    const elkEdges = layoutedGraph.edges || [];

    // Map Nodes and Packages recursively
    this.processElkNodes(elkNodes, model, 0, 0);

    // Map Edges (Waypoints) using ID matching
    for (const elkEdge of elkEdges) {
      if (!elkEdge.id || !elkEdge.id.startsWith('e')) continue;

      const edgeIndex = parseInt(elkEdge.id.substring(1));
      const edge = model.edges[edgeIndex];

      if (edge && elkEdge.sections && elkEdge.sections.length > 0) {
        const section = elkEdge.sections[0];
        const waypoints = [];

        // Start point
        waypoints.push({ x: section.startPoint.x, y: section.startPoint.y });

        // Bend points
        if (section.bendPoints) {
          for (const bp of section.bendPoints) {
            waypoints.push({ x: bp.x, y: bp.y });
          }
        }

        // End point
        waypoints.push({ x: section.endPoint.x, y: section.endPoint.y });

        edge.waypoints = waypoints;
      }
    }
  }

  private processElkNodes(elkNodes: ElkNode[], model: DiagramModel, offsetX: number, offsetY: number): void {
    for (const elkNode of elkNodes) {
      if (elkNode.id.startsWith('pkg:')) {
        const pkgId = elkNode.id.replace('pkg:', '');
        const pkg = this.findPackage(model.packages, pkgId);
        if (pkg) {
          pkg.x = (elkNode.x || 0) + offsetX;
          pkg.y = (elkNode.y || 0) + offsetY;
          pkg.width = elkNode.width;
          pkg.height = elkNode.height;

          if (elkNode.children) {
            this.processElkNodes(elkNode.children, model, pkg.x, pkg.y);
          }
        }
      } else {
        const node = model.nodes.find(n => n.id === elkNode.id);
        if (node) {
          node.x = (elkNode.x || 0) + offsetX;
          node.y = (elkNode.y || 0) + offsetY;
          node.width = elkNode.width;
          node.height = elkNode.height;
        }
      }
    }
  }

  private findPackage(packages: DiagramPackage[], id: string): DiagramPackage | undefined {
    for (const pkg of packages) {
      if (pkg.id === id || pkg.name === id) return pkg;
      const nestedPackages = pkg.children.filter((c): c is DiagramPackage => 'children' in c);
      const found = this.findPackage(nestedPackages, id);
      if (found) return found;
    }
    return undefined;
  }

  private isNodeInPackages(node: DiagramNode, packages: DiagramPackage[]): boolean {
    for (const pkg of packages) {
      const hasNode = pkg.children.some(child => !('children' in child) && child.id === node.id);
      if (hasNode) return true;
      const nestedPackages = pkg.children.filter((c): c is DiagramPackage => 'children' in c);
      if (this.isNodeInPackages(node, nestedPackages)) return true;
    }
    return false;
  }
}
