import { UMLComponent } from './component.abstract'
import { type Size, type UMLPort } from './types'

/**
 * 1. SPATIAL NODES (Bounding Boxes)
 * Elements positioned globally by the layout engine (ELK).
 */
export abstract class UMLSpatialNode extends UMLComponent {
  public x = 0
  public y = 0
  public width = 0
  public height = 0
  public ports: UMLPort[] = []
  public namespace?: string

  /**
   * Calculates dimensions of the component.
   */
  public getDimensions(): Size {
    return { width: this.width || 0, height: this.height || 0 }
  }

  /**
   * Updates global coordinates after layout.
   */
  public updateLayout(x: number, y: number, w: number, h: number): void {
    this.x = x
    this.y = y
    this.width = w
    this.height = h
  }

  /**
   * Updates ports coordinates after layout.
   */
  public updatePorts(ports: UMLPort[]): void {
    this.ports = ports
  }

  /**
   * Transforms this node into an object compatible with ELK.
   */
  public toLayoutNode(): Record<string, unknown> {
    const dim = this.getDimensions()
    return {
      id: this.id,
      width: dim.width,
      height: dim.height,
      ports: this.ports.map((p) => ({
        id: p.id,
        labels: [],
        layoutOptions: { 'port.side': p.side },
      })),
    }
  }

  /**
   * Compatibility helpers for layout and scoring.
   */
  public get type(): string {
    return 'Unknown'
  }

  public get isAbstract(): boolean {
    return false
  }

  public get name(): string {
    return this.id
  }
}
