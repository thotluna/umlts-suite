import { BASE_LAYOUT_OPTIONS } from './consts'
import { LayoutConfig } from './types'

export class DiagramConfig {
  private layoutOptions: Record<string, string> = { ...BASE_LAYOUT_OPTIONS }

  constructor(private readonly config?: LayoutConfig) {
    this.setConfig()
  }

  private setConfig() {
    if (!this.config) return

    if (this.config.direction) {
      this.layoutOptions['elk.direction'] = this.config.direction
    }

    if (this.config.spacing) {
      const s = this.config.spacing.toString()
      this.layoutOptions['elk.spacing.nodeNode'] = s
      this.layoutOptions['elk.layered.spacing.nodeNodeBetweenLayers'] = s
      this.layoutOptions['elk.spacing.componentComponent'] = s
      this.layoutOptions['elk.spacing.edgeNode'] = (this.config.spacing * 0.5).toString()
    }

    if (this.config.nodePadding) {
      const p = this.config.nodePadding
      this.layoutOptions['elk.padding'] = `[top=${p},left=${p},bottom=${p},right=${p}]`
    }

    if (this.config.routing) {
      this.layoutOptions['elk.edgeRouting'] = this.config.routing
    }
  }

  public getLayoutOptions(): Record<string, string> {
    return this.layoutOptions
  }
}
