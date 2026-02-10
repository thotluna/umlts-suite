
import { LayoutResult, DiagramPackage, DiagramModel } from './types';
import { Theme } from './theme';
import * as svg from '../utils/svg-helpers';
import { renderClassNode } from '../elements/class-node';
import { renderEdge, renderMarkers } from '../elements/edges';

/**
 * SVGRenderer: Orchestrates the generation of the SVG string from a layouted result.
 */
export class SVGRenderer {

  public render(layoutResult: LayoutResult, theme: Theme): string {
    const { model, totalWidth, totalHeight } = layoutResult;

    // 1. Defs (Markers)
    const defs = renderMarkers(theme);

    // 2. Packages (Backgrounds)
    const packagesStr = svg.g({ class: 'packages' },
      model.packages.map(p => this.renderPackage(p, theme)).join('')
    );

    // 3. Edges (Behind nodes)
    const edgesStr = svg.g({ class: 'edges' },
      model.edges.map((e, i) => renderEdge(e, i, theme)).join('')
    );

    // 4. Nodes
    const nodesStr = svg.g({ class: 'nodes' },
      model.nodes.map(n => renderClassNode(n, theme)).join('')
    );

    // Combine everything
    const content = defs + packagesStr + edgesStr + nodesStr;

    return svg.tag('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: totalWidth,
      height: totalHeight,
      viewBox: `0 0 ${totalWidth} ${totalHeight}`,
      style: `background-color: ${theme.canvasBackground}; font-family: ${theme.fontFamily};`
    }, content);
  }

  private renderPackage(pkg: DiagramPackage, theme: Theme): string {
    const { x = 0, y = 0, width = 0, height = 0 } = pkg;

    // Package body
    const rect = svg.rect({
      x, y, width: width, height: height,
      fill: 'rgba(0,0,0,0.03)',
      stroke: theme.nodeBorder,
      'stroke-width': 1,
      'stroke-dasharray': '5,5',
      rx: 8
    });

    // Package label (tab style)
    const label = svg.text({
      x: x + 10,
      y: y + 20,
      fill: theme.nodeHeaderText,
      'font-weight': 'bold',
      'font-size': '12px',
      'opacity': 0.6
    }, pkg.name);

    // Recursively render children packages
    const childrenPkgs = pkg.children
      .filter((c): c is DiagramPackage => 'children' in c)
      .map(c => this.renderPackage(c, theme))
      .join('');

    return svg.g({ class: 'package', 'data-name': pkg.name }, rect + label + childrenPkgs);
  }
}
