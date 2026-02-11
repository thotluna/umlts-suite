---
name: uml-diagram-generation
description: Expert guidance for generating UML diagrams from AST representations. Use when converting parsed DSL code into visual diagrams, implementing diagram layout algorithms, rendering class diagrams, sequence diagrams, or other UML visualizations. Covers multiple rendering engines (PlantUML, Mermaid, D3.js, Graphviz, custom SVG), layout algorithms, styling, export formats (SVG, PNG, PDF), and optimization for large diagrams. Ideal for diagram generators, visualization tools, and documentation systems.
---

# UML Diagram Generation

A comprehensive skill for transforming Abstract Syntax Trees (ASTs) into beautiful, professional UML diagrams.

## When to Use This Skill

Use this skill when the user wants to:

- Convert AST to visual UML diagrams
- Choose between diagram rendering engines (PlantUML, Mermaid, D3, Graphviz)
- Implement layout algorithms for class diagrams
- Generate SVG/PNG/PDF outputs
- Style and customize diagram appearance
- Handle large diagrams with many elements
- Implement real-time diagram updates
- Export diagrams in multiple formats
- Optimize rendering performance
- Create interactive diagrams

## Diagram Generation Architecture

```
AST (from Parser)
    ↓
┌─────────────────────────────────┐
│   AST Traversal & Analysis      │
│   - Extract classes              │
│   - Extract relationships        │
│   - Build symbol table           │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│   Intermediate Representation    │
│   - Nodes (classes, interfaces, enums) │
│   - Edges (relationships)        │
│   - Metadata (isStatic, isActive, isAbstract) │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│   Layout Algorithm               │
│   - Calculate positions          │
│   - Minimize edge crossings      │
│   - Optimize spacing             │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│   Rendering Engine               │
│   PlantUML / Mermaid / D3 / SVG  │
└─────────────────────────────────┘
    ↓
Visual Diagram (SVG/PNG/PDF)
```

## Choosing a Rendering Engine

### Comparison Matrix

| Engine | Pros | Cons | Best For |
|--------|------|------|----------|
| **PlantUML** | Mature, feature-rich, text-based | Java dependency, slower | Server-side, complex diagrams |
| **Mermaid** | JavaScript-native, popular, simple | Limited customization | Web apps, basic diagrams |
| **D3.js** | Full control, interactive, beautiful | Steep learning curve | Custom interactive diagrams |
| **Graphviz** | Excellent layout algorithms | C dependency, styling limits | Auto-layout focus |
| **Custom SVG** | Complete control, no dependencies | Must implement everything | Specific requirements |

### Recommendation for Your UML DSL

For a VSCode extension with TypeScript/JavaScript:

**Best Choice: Mermaid + Custom SVG**
- Use **Mermaid** for quick prototypes and simple diagrams
- Use **Custom SVG** for full control and complex layouts
- Both work in browser (WebView) without external dependencies

**Alternative: D3.js**
- Best if you need interactive diagrams
- Great for large, complex visualizations
- Steeper learning curve but maximum flexibility

## Strategy 1: Using Mermaid

### Why Mermaid?
- ✅ JavaScript-native (no Java needed)
- ✅ Works in browser
- ✅ Simple text format
- ✅ VSCode has built-in support
- ✅ Good for basic class diagrams

// src/generators/mapper.ts
// El objetivo es mapear el AST JSON crudo a un módelo de datos limpio para el generador.

interface ASTNode {
  type: string;
  [key: string]: any;
}

interface ClassInfo {
  name: string;
  attributes: Array<{ name: string; type: string; visibility: string }>;
  methods: Array<{ name: string; returnType: string; visibility: string }>;
}

interface RelationshipInfo {
  from: string;
  to: string;
  type: 'inheritance' | 'implementation' | 'association' | 'composition' | 'aggregation';
  label?: string;
  multiplicity?: { from: string; to: string };
}

export class MermaidGenerator {
  private classes: Map<string, ClassInfo> = new Map();
  private relationships: RelationshipInfo[] = [];

  public generateFromAST(rootNode: ASTNode): string {
    // El generador consume el AST JSON generado por nuestro Parser manual
    this.classes.clear();
    this.relationships = [];

    this.processNodes(rootNode);

    return this.generateMermaidCode();
  }

  private parseClassNode(node: Parser.SyntaxNode): ClassInfo {
    const nameNode = node.childForFieldName('name');
    const name = nameNode?.text || 'Unknown';

    const attributes: ClassInfo['attributes'] = [];
    const methods: ClassInfo['methods'] = [];

    // Find all members
    const membersNode = node.children.find(n => n.type === 'class_body');
    if (membersNode) {
      for (const member of membersNode.children) {
        if (member.type === 'attribute') {
          attributes.push(this.parseAttribute(member));
        } else if (member.type === 'method') {
          methods.push(this.parseMethod(member));
        }
      }
    }

    return { name, attributes, methods };
  }

  private parseAttribute(node: Parser.SyntaxNode) {
    const name = node.childForFieldName('name')?.text || '';
    const type = node.childForFieldName('type')?.text || 'any';
    const visibility = this.getVisibility(node);

    return { name, type, visibility };
  }

  private parseMethod(node: Parser.SyntaxNode) {
    const name = node.childForFieldName('name')?.text || '';
    const returnType = node.childForFieldName('return_type')?.text || 'void';
    const visibility = this.getVisibility(node);

    return { name, returnType, visibility };
  }

  private getVisibility(node: Parser.SyntaxNode): string {
    const visibilityNode = node.children.find(n => 
      ['+', '-', '#', '~'].includes(n.text)
    );
    
    const symbol = visibilityNode?.text || '+';
    
    // Convert to Mermaid visibility symbols
    const visibilityMap: Record<string, string> = {
      '+': '+',  // public
      '-': '-',  // private
      '#': '#',  // protected
      '~': '~'   // package
    };

    return visibilityMap[symbol] || '+';
  }

  private extractRelationships(node: Parser.SyntaxNode) {
    if (node.type === 'relationship_declaration') {
      const relationship = this.parseRelationshipNode(node);
      this.relationships.push(relationship);
    }

    for (const child of node.children) {
      this.extractRelationships(child);
    }
  }

  private parseRelationshipNode(node: Parser.SyntaxNode): RelationshipInfo {
    const from = node.childForFieldName('from')?.text || '';
    const to = node.childForFieldName('to')?.text || '';
    const arrowNode = node.childForFieldName('arrow');
    const arrow = arrowNode?.text || '->';

    // Map arrow symbols to relationship types
    const arrowMap: Record<string, RelationshipInfo['type']> = {
      '->': 'association',
      '<|--': 'inheritance',
      '..|>': 'implementation',
      'o--': 'aggregation',
      '*--': 'composition'
    };

    const type = arrowMap[arrow] || 'association';

    const labelNode = node.children.find(n => n.type === 'string');
    const label = labelNode ? labelNode.text.replace(/"/g, '') : undefined;

    return { from, to, type, label };
  }

  private generateMermaidCode(): string {
    const lines: string[] = ['classDiagram'];

    // Generate class definitions
    for (const [className, classInfo] of this.classes) {
      lines.push(`  class ${className} {`);

      // Add attributes
      for (const attr of classInfo.attributes) {
        lines.push(`    ${attr.visibility}${attr.type} ${attr.name}`);
      }

      // Add methods
      for (const method of classInfo.methods) {
        lines.push(`    ${method.visibility}${method.name}() ${method.returnType}`);
      }

      lines.push('  }');
      lines.push('');
    }

    // Generate relationships
    for (const rel of this.relationships) {
      const arrow = this.getMermaidArrow(rel.type);
      const label = rel.label ? ` : ${rel.label}` : '';
      lines.push(`  ${rel.from} ${arrow} ${rel.to}${label}`);
    }

    return lines.join('\n');
  }

  private getMermaidArrow(type: RelationshipInfo['type']): string {
    const arrows: Record<RelationshipInfo['type'], string> = {
      'inheritance': '<|--',
      'implementation': '..|>',
      'association': '-->',
      'aggregation': 'o--',
      'composition': '*--'
    };

    return arrows[type];
  }
}

// Usage example
export function generateDiagram(rootNode: Parser.SyntaxNode): string {
  const generator = new MermaidGenerator();
  return generator.generateFromAST(rootNode);
}
```

### Rendering Mermaid in Browser

```typescript
// In your WebView panel
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true
  }
});

async function renderDiagram(mermaidCode: string) {
  const container = document.getElementById('diagram-container');
  
  try {
    const { svg } = await mermaid.render('diagram', mermaidCode);
    container.innerHTML = svg;
  } catch (error) {
    console.error('Mermaid rendering error:', error);
    container.innerHTML = `<div class="error">Failed to render diagram</div>`;
  }
}
```

## Strategy 2: Custom SVG Generation

For full control over layout and styling:

### SVG Generator Implementation

```typescript
// src/generators/svg-generator.ts
import Parser from 'web-tree-sitter';

interface Point { x: number; y: number; }
interface Size { width: number; height: number; }
interface Rect extends Point, Size {}

interface ClassBox {
  name: string;
  attributes: string[];
  methods: string[];
  bounds: Rect;
}

interface Edge {
  from: string;
  to: string;
  type: string;
  points: Point[];
}

export class SVGGenerator {
  private readonly CLASS_WIDTH = 200;
  private readonly CLASS_PADDING = 10;
  private readonly LINE_HEIGHT = 20;
  private readonly HORIZONTAL_GAP = 100;
  private readonly VERTICAL_GAP = 80;

  private classes: Map<string, ClassBox> = new Map();
  private edges: Edge[] = [];

  public generateFromAST(rootNode: Parser.SyntaxNode): string {
    // Extract classes and relationships
    this.extractInformation(rootNode);

    // Calculate layout
    this.calculateLayout();

    // Generate SVG
    return this.generateSVG();
  }

  private extractInformation(node: Parser.SyntaxNode) {
    // Similar to Mermaid generator
    // ... (extract classes and relationships)
  }

  private calculateLayout() {
    // Simple grid layout
    const classNames = Array.from(this.classes.keys());
    const cols = Math.ceil(Math.sqrt(classNames.length));

    classNames.forEach((name, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      const classBox = this.classes.get(name)!;
      const height = this.calculateClassHeight(classBox);

      classBox.bounds = {
        x: col * (this.CLASS_WIDTH + this.HORIZONTAL_GAP) + 50,
        y: row * (height + this.VERTICAL_GAP) + 50,
        width: this.CLASS_WIDTH,
        height
      };
    });

    // Calculate edge paths
    this.calculateEdgePaths();
  }

  private calculateClassHeight(classBox: ClassBox): number {
    const headerHeight = this.LINE_HEIGHT + this.CLASS_PADDING * 2;
    const attributesHeight = classBox.attributes.length * this.LINE_HEIGHT + this.CLASS_PADDING;
    const methodsHeight = classBox.methods.length * this.LINE_HEIGHT + this.CLASS_PADDING;

    return headerHeight + attributesHeight + methodsHeight;
  }

  private calculateEdgePaths() {
    for (const edge of this.edges) {
      const fromBox = this.classes.get(edge.from);
      const toBox = this.classes.get(edge.to);

      if (!fromBox || !toBox) continue;

      // Simple straight line from center to center
      const fromCenter = {
        x: fromBox.bounds.x + fromBox.bounds.width / 2,
        y: fromBox.bounds.y + fromBox.bounds.height / 2
      };

      const toCenter = {
        x: toBox.bounds.x + toBox.bounds.width / 2,
        y: toBox.bounds.y + toBox.bounds.height / 2
      };

      // Find intersection points with box boundaries
      const fromPoint = this.getBoxIntersection(fromBox.bounds, fromCenter, toCenter);
      const toPoint = this.getBoxIntersection(toBox.bounds, toCenter, fromCenter);

      edge.points = [fromPoint, toPoint];
    }
  }

  private getBoxIntersection(box: Rect, from: Point, to: Point): Point {
    // Calculate intersection with box edge
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    // Simplified: return edge point
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal edge
      return {
        x: dx > 0 ? box.x + box.width : box.x,
        y: from.y
      };
    } else {
      // Vertical edge
      return {
        x: from.x,
        y: dy > 0 ? box.y + box.height : box.y
      };
    }
  }

  private generateSVG(): string {
    const { width, height } = this.calculateCanvasSize();

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    
    // Add styles
    svg += this.generateStyles();

    // Add edges first (so they're behind classes)
    for (const edge of this.edges) {
      svg += this.generateEdge(edge);
    }

    // Add classes
    for (const classBox of this.classes.values()) {
      svg += this.generateClass(classBox);
    }

    svg += '</svg>';

    return svg;
  }

  private generateStyles(): string {
    return `
      <defs>
        <style>
          .class-box { fill: #f9f9f9; stroke: #333; stroke-width: 2; }
          .class-name { font-family: Arial; font-size: 14px; font-weight: bold; text-anchor: middle; }
          .class-member { font-family: monospace; font-size: 12px; }
          .separator { stroke: #333; stroke-width: 1; }
          .edge { stroke: #333; stroke-width: 2; fill: none; }
          .edge-label { font-family: Arial; font-size: 10px; fill: #666; }
          .arrow { fill: #333; }
        </style>
        
        <!-- Arrow markers -->
        <marker id="arrow-inheritance" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" class="arrow" fill="none" stroke="#333" />
        </marker>
        <marker id="arrow-association" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" class="arrow" />
        </marker>
        <marker id="arrow-composition" markerWidth="12" markerHeight="10" refX="0" refY="3" orient="auto">
          <polygon points="0 3, 6 0, 12 3, 6 6" class="arrow" />
        </marker>
      </defs>
    `;
  }

  private generateClass(classBox: ClassBox): string {
    const { x, y, width, height } = classBox.bounds;

    let svg = `<g class="class" data-name="${classBox.name}">`;

    // Background rectangle
    svg += `<rect x="${x}" y="${y}" width="${width}" height="${height}" class="class-box" />`;

    // Class name
    const nameY = y + this.LINE_HEIGHT + this.CLASS_PADDING;
    svg += `<text x="${x + width/2}" y="${nameY}" class="class-name">${classBox.name}</text>`;

    // Separator after name
    const separatorY1 = nameY + this.CLASS_PADDING;
    svg += `<line x1="${x}" y1="${separatorY1}" x2="${x + width}" y2="${separatorY1}" class="separator" />`;

    // Attributes
    let currentY = separatorY1 + this.CLASS_PADDING;
    for (const attr of classBox.attributes) {
      currentY += this.LINE_HEIGHT;
      svg += `<text x="${x + 10}" y="${currentY}" class="class-member">${attr}</text>`;
    }

    // Separator after attributes
    currentY += this.CLASS_PADDING;
    svg += `<line x1="${x}" y1="${currentY}" x2="${x + width}" y2="${currentY}" class="separator" />`;

    // Methods
    currentY += this.CLASS_PADDING;
    for (const method of classBox.methods) {
      currentY += this.LINE_HEIGHT;
      svg += `<text x="${x + 10}" y="${currentY}" class="class-member">${method}</text>`;
    }

    // Active Class double vertical border logic
    if (classBox.isActive) {
      svg += `<line x1="${x + 5}" y1="${y}" x2="${x + 5}" y2="${y + height}" stroke="black" stroke-width="1" />`;
      svg += `<line x1="${x + width - 5}" y1="${y}" x2="${x + width - 5}" y2="${y + height}" stroke="black" stroke-width="1" />`;
    }

    svg += '</g>';

    return svg;
  }

  private generateEdge(edge: Edge): string {
    const [from, to] = edge.points;
    
    const marker = this.getMarkerForType(edge.type);
    
    let svg = `<g class="relationship" data-from="${edge.from}" data-to="${edge.to}">`;
    svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" class="edge" marker-end="url(#${marker})" />`;
    svg += '</g>';

    return svg;
  }

  private getMarkerForType(type: string): string {
    const markers: Record<string, string> = {
      'inheritance': 'arrow-inheritance',
      'association': 'arrow-association',
      'composition': 'arrow-composition',
      'aggregation': 'arrow-association'
    };

    return markers[type] || 'arrow-association';
  }

  private calculateCanvasSize(): Size {
    let maxX = 0;
    let maxY = 0;

    for (const classBox of this.classes.values()) {
      const right = classBox.bounds.x + classBox.bounds.width;
      const bottom = classBox.bounds.y + classBox.bounds.height;

      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    }

    return {
      width: maxX + 50,
      height: maxY + 50
    };
  }
}
```

## Strategy 3: Using D3.js for Interactive Diagrams

```typescript
// src/generators/d3-generator.ts
import * as d3 from 'd3';

interface Node {
  id: string;
  name: string;
  attributes: string[];
  methods: string[];
  x?: number;
  y?: number;
}

interface Link {
  source: string | Node;
  target: string | Node;
  type: string;
}

export class D3DiagramGenerator {
  private svg: any;
  private width: number;
  private height: number;

  constructor(containerId: string, width: number, height: number) {
    this.width = width;
    this.height = height;

    this.svg = d3.select(`#${containerId}`)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
  }

  public render(nodes: Node[], links: Link[]) {
    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(200))
      .force('charge', d3.forceManyBody().strength(-1000))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide().radius(120));

    // Draw links
    const linkElements = this.svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-width', 2);

    // Draw nodes (classes)
    const nodeElements = this.svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(this.drag(simulation));

    // Add class rectangles
    nodeElements.append('rect')
      .attr('width', 200)
      .attr('height', (d: Node) => this.calculateHeight(d))
      .attr('fill', '#f9f9f9')
      .attr('stroke', '#333')
      .attr('stroke-width', 2)
      .attr('rx', 5);

    // Add class names
    nodeElements.append('text')
      .attr('x', 100)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .text((d: Node) => d.name);

    // Add attributes and methods
    nodeElements.each(function(d: Node) {
      const node = d3.select(this);
      let y = 40;

      // Attributes
      d.attributes.forEach(attr => {
        node.append('text')
          .attr('x', 10)
          .attr('y', y)
          .attr('font-size', '12px')
          .text(attr);
        y += 15;
      });

      y += 5; // Separator

      // Methods
      d.methods.forEach(method => {
        node.append('text')
          .attr('x', 10)
          .attr('y', y)
          .attr('font-size', '12px')
          .text(method);
        y += 15;
      });
    });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeElements
        .attr('transform', (d: any) => `translate(${d.x - 100}, ${d.y})`);
    });
  }

  private calculateHeight(node: Node): number {
    const headerHeight = 30;
    const attributesHeight = node.attributes.length * 15;
    const methodsHeight = node.methods.length * 15;
    const padding = 20;

    return headerHeight + attributesHeight + methodsHeight + padding;
  }

  private drag(simulation: any) {
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }
}
```

## Layout Algorithms

### 1. Grid Layout (Simple)

```typescript
function gridLayout(classes: ClassBox[], cols: number) {
  classes.forEach((classBox, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    classBox.x = col * (CLASS_WIDTH + HORIZONTAL_GAP);
    classBox.y = row * (CLASS_HEIGHT + VERTICAL_GAP);
  });
}
```

### 2. Hierarchical Layout (For Inheritance)

```typescript
function hierarchicalLayout(classes: ClassBox[], relationships: Edge[]) {
  // Build inheritance tree
  const tree = buildInheritanceTree(classes, relationships);

  // Assign levels
  const levels: ClassBox[][] = [];
  assignLevels(tree.root, 0, levels);

  // Position classes
  levels.forEach((level, y) => {
    const width = level.length * (CLASS_WIDTH + HORIZONTAL_GAP);
    level.forEach((classBox, index) => {
      classBox.x = (index * (CLASS_WIDTH + HORIZONTAL_GAP)) - width / 2 + CANVAS_WIDTH / 2;
      classBox.y = y * (CLASS_HEIGHT + VERTICAL_GAP) + 50;
    });
  });
}
```

### 3. Force-Directed Layout

```typescript
// Using D3's force simulation (shown above)
// Automatically spreads nodes based on links and repulsion
```

## Export Formats

### SVG to PNG

```typescript
async function svgToPNG(svgString: string, width: number, height: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/png');
    };

    img.onerror = reject;

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    img.src = URL.createObjectURL(blob);
  });
}
```

### SVG to PDF

```typescript
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';

async function svgToPDF(svgString: string): Promise<Blob> {
  const pdf = new jsPDF();
  const svgElement = new DOMParser().parseFromString(svgString, 'image/svg+xml').documentElement;

  await pdf.svg(svgElement, {
    x: 0,
    y: 0,
    width: 210, // A4 width in mm
    height: 297  // A4 height in mm
  });

  return pdf.output('blob');
}
```

## Styling and Themes

### Theme System

```typescript
interface DiagramTheme {
  background: string;
  classBox: {
    fill: string;
    stroke: string;
    strokeWidth: number;
  };
  text: {
    fontFamily: string;
    fontSize: number;
    color: string;
  };
  edge: {
    stroke: string;
    strokeWidth: number;
  };
}

const themes: Record<string, DiagramTheme> = {
  light: {
    background: '#ffffff',
    classBox: {
      fill: '#f9f9f9',
      stroke: '#333333',
      strokeWidth: 2
    },
    text: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      color: '#000000'
    },
    edge: {
      stroke: '#666666',
      strokeWidth: 2
    }
  },
  dark: {
    background: '#1e1e1e',
    classBox: {
      fill: '#2d2d2d',
      stroke: '#cccccc',
      strokeWidth: 2
    },
    text: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      color: '#ffffff'
    },
    edge: {
      stroke: '#999999',
      strokeWidth: 2
    }
  }
};
```

## Performance Optimization

### 1. Incremental Rendering

```typescript
class IncrementalRenderer {
  private renderQueue: ClassBox[] = [];
  private rendering = false;

  public queueRender(classBox: ClassBox) {
    this.renderQueue.push(classBox);
    this.processQueue();
  }

  private async processQueue() {
    if (this.rendering) return;

    this.rendering = true;

    while (this.renderQueue.length > 0) {
      const classBox = this.renderQueue.shift()!;
      await this.renderClass(classBox);

      // Yield to browser
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    this.rendering = false;
  }

  private async renderClass(classBox: ClassBox) {
    // Render single class
  }
}
```

### 2. Virtualization for Large Diagrams

```typescript
class VirtualizedRenderer {
  private viewport: Rect;

  public render(classes: ClassBox[]) {
    // Only render visible classes
    const visibleClasses = classes.filter(c => 
      this.isVisible(c.bounds, this.viewport)
    );

    for (const classBox of visibleClasses) {
      this.renderClass(classBox);
    }
  }

  private isVisible(bounds: Rect, viewport: Rect): boolean {
    return !(
      bounds.x + bounds.width < viewport.x ||
      bounds.x > viewport.x + viewport.width ||
      bounds.y + bounds.height < viewport.y ||
      bounds.y > viewport.y + viewport.height
    );
  }
}
```

### 3. Caching

```typescript
class CachedRenderer {
  private cache = new Map<string, string>();

  public renderClass(classBox: ClassBox): string {
    const cacheKey = this.getCacheKey(classBox);

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const svg = this.generateClassSVG(classBox);
    this.cache.set(cacheKey, svg);

    return svg;
  }

  private getCacheKey(classBox: ClassBox): string {
    return JSON.stringify({
      name: classBox.name,
      attributes: classBox.attributes,
      methods: classBox.methods
    });
  }

  private generateClassSVG(classBox: ClassBox): string {
    // Generate SVG
    return '';
  }
}
```

## Complete Integration Example

```typescript
// src/diagram-service.ts
import Parser from 'web-tree-sitter';
import { MermaidGenerator } from './generators/mermaid-generator';
import { SVGGenerator } from './generators/svg-generator';

export type DiagramFormat = 'mermaid' | 'svg' | 'd3';
export type ExportFormat = 'svg' | 'png' | 'pdf';

export class DiagramService {
  private mermaidGenerator = new MermaidGenerator();
  private svgGenerator = new SVGGenerator();

  public async generateDiagram(
    rootNode: Parser.SyntaxNode,
    format: DiagramFormat = 'svg'
  ): Promise<string> {
    switch (format) {
      case 'mermaid':
        return this.mermaidGenerator.generateFromAST(rootNode);
      
      case 'svg':
        return this.svgGenerator.generateFromAST(rootNode);
      
      case 'd3':
        // D3 requires DOM, return data instead
        return this.generateD3Data(rootNode);
      
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }

  public async exportDiagram(
    diagram: string,
    format: ExportFormat
  ): Promise<Blob> {
    switch (format) {
      case 'svg':
        return new Blob([diagram], { type: 'image/svg+xml' });
      
      case 'png':
        return await this.svgToPNG(diagram);
      
      case 'pdf':
        return await this.svgToPDF(diagram);
      
      default:
        throw new Error(`Unknown export format: ${format}`);
    }
  }

  private async svgToPNG(svgString: string): Promise<Blob> {
    // Implementation from above
    return new Blob();
  }

  private async svgToPDF(svgString: string): Promise<Blob> {
    // Implementation from above
    return new Blob();
  }

  private generateD3Data(rootNode: Parser.SyntaxNode): string {
    // Extract nodes and links for D3
    return JSON.stringify({ nodes: [], links: [] });
  }
}
```

## Best Practices

### 1. Separation of Concerns

```
AST Extraction → Intermediate Model → Layout → Rendering
```

Each stage is independent and testable.

### 2. Testable Generators

```typescript
describe('MermaidGenerator', () => {
  it('generates correct mermaid syntax for simple class', () => {
    const ast = parseUML('class User { name: String }');
    const mermaid = new MermaidGenerator().generateFromAST(ast);
    
    expect(mermaid).toContain('class User');
    expect(mermaid).toContain('String name');
  });
});
```

### 3. Progressive Enhancement

Start simple, add complexity:
1. Static SVG
2. Basic styling
3. Layout algorithms
4. Interactivity
5. Export formats

### 4. Accessibility

```xml
<svg role="img" aria-labelledby="diagram-title">
  <title id="diagram-title">UML Class Diagram</title>
  <desc>Diagram showing User, Order, and Product classes with their relationships</desc>
  <!-- diagram content -->
</svg>
```

## Recommended Workflow

For your UML DSL project:

1. **Start with Mermaid** for quick prototyping
2. **Implement Custom SVG** for full control
3. **Add D3.js** if you need interactivity
4. **Optimize** layout algorithms
5. **Add export** formats (PNG, PDF)
6. **Polish** styling and themes

## Conclusion

Diagram generation is the visual payoff of your DSL! Choose the right rendering engine for your needs, implement clean separation between AST extraction and rendering, and optimize for your use cases (small diagrams vs large systems, static vs interactive).

The key is starting simple and iterating based on user feedback.
