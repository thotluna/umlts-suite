import { LayoutResult, UMLPackage, DiagramModel, UMLNode, UMLEdge, UMLHierarchyItem, DiagramConfig } from '../core/types';
import { Theme } from '../core/theme';
import { SVGBuilder as svg } from './svg-helpers';
import { DrawingRegistry } from './drawable';

// Ensure renderers are registered
import './elements/class-node';
import './elements/edges';
import { renderMarkers } from './elements/edges';

/**
 * SVGRenderer: Orchestrates the generation of the SVG string from a layouted result.
 */
export class SVGRenderer {

  public render(layoutResult: LayoutResult, theme: Theme, config?: DiagramConfig['render']): string {
    const { model, totalWidth, totalHeight } = layoutResult;

    // 1. Defs (Markers)
    const defs = renderMarkers(theme);

    // 2. Packages (Backgrounds)
    // 2. Render Packages
    const packagesStr = model.packages.map(pkg => this.renderPackage(pkg, theme)).join('');

    // 3. Render Top-level Nodes (not in packages)
    const nodesStr = model.nodes
      .filter(n => !n.namespace)
      .map(node => DrawingRegistry.render('Node', node, theme, config))
      .join('');

    // 4. Render Edges
    const edgesStr = model.edges.map((edge, idx) => DrawingRegistry.render('Edge', edge, theme, config)).join('');

    // Combine everything with proper grouping
    const content = defs +
      svg.g({ class: 'packages' }, packagesStr) +
      svg.g({ class: 'edges' }, edgesStr) +
      svg.g({ class: 'nodes' }, nodesStr);

    return svg.tag('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: totalWidth,
      height: totalHeight,
      viewBox: `0 0 ${totalWidth} ${totalHeight}`,
      style: `background-color: ${theme.canvasBackground}; font-family: ${theme.fontFamily};`
    }, content);
  }

  /**
   * Renders a UML package and its nested elements recursively.
   */
  private renderPackage(pkg: UMLPackage, theme: Theme, config?: DiagramConfig['render']): string {
    const { x = 0, y = 0, width = 0, height = 0 } = pkg;

    // Package body
    const rect = svg.rect({
      x, y, width: width, height: height,
      fill: theme.packageBackground,
      stroke: theme.packageBorder,
      'stroke-width': 1.2,
      rx: 8
    });

    // Package label (tab style)
    const label = svg.text({
      x: x + 10,
      y: y + 20,
      fill: theme.packageLabelText,
      'font-weight': 'bold',
      'font-size': '11px',
      'text-transform': 'uppercase',
      'letter-spacing': '1px'
    }, pkg.name);

    // 2. Render children (nested packages or nodes)
    const childrenStr = pkg.children.map((c: UMLHierarchyItem) => {
      if (c instanceof UMLPackage) {
        return this.renderPackage(c, theme, config);
      }
      return DrawingRegistry.render('Node', c, theme, config);
    }).join('');

    return svg.g({ class: 'package', 'data-name': pkg.name }, rect + label + childrenStr);
  }
}
