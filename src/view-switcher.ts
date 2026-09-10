import {
  signal,
  Widget,
  type WidgetConfigValues,
  type WritableSignal,
} from '@displayduck/base';

type ViewSwitcherConfig = WidgetConfigValues & { view?: number };

export class DisplayDuckWidget extends Widget<ViewSwitcherConfig> {
  public readonly view: WritableSignal<number> = signal(1);

  public onInit(): void {
    this.view.set(this.getConfiguredView());
    this.on('click', '[data-view-switcher]', () => {
      void this.switchView();
    });
  }

  public onUpdate(): void {
    this.view.set(this.getConfiguredView());
  }

  private getConfiguredView(): number {
    const value = Number(this.config.view ?? 1);
    return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
  }

  private async switchView(): Promise<void> {
    try {
      await this.app.switchView(this.view());
    } catch (error) {
      console.error('[DisplayDuck View Switcher] failed to switch view', error);
    }
  }
}
