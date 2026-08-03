import { emit, emitTo } from '@tauri-apps/api/event';
import { BaseDirectory } from '@tauri-apps/api/path';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import {
  signal,
  type WidgetContext,
  type WidgetPayload,
  type WritableSignal,
} from '@displayduck/base';

type ViewSwitcherConfig = { view?: number };

type StoredView = {
  id?: string;
  name?: string;
  active?: boolean;
  widgets?: unknown[];
  [key: string]: unknown;
};

type StoredConfig = {
  views?: StoredView[];
  [key: string]: unknown;
};

const readConfig = (payload: WidgetPayload): ViewSwitcherConfig => {
  const config = payload.config;
  return config && typeof config === 'object' ? config as ViewSwitcherConfig : {};
};

export class DisplayDuckWidget {
  public readonly config: WritableSignal<ViewSwitcherConfig>;
  public readonly view: WritableSignal<number>;

  private destroyed = false;

  public constructor(private readonly ctx: WidgetContext) {
    this.config = signal(readConfig(ctx.payload ?? {}));
    this.view = signal(this.getConfiguredView(this.config()));
  }

  public onInit(): void {
    this.ctx.on('click', '[data-view-switcher]', () => {
      void this.setView(this.view());
    });
  }

  public onUpdate(payload: WidgetPayload): void {
    this.config.set(readConfig(payload ?? {}));
    this.view.set(this.getConfiguredView(this.config()));
  }

  public onDestroy(): void {
    this.destroyed = true;
  }

  private getConfiguredView(config: ViewSwitcherConfig): number {
    const value = Number(config.view ?? 1);
    return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
  }

  private async setView(viewNumber: number): Promise<void> {
    if (this.destroyed) return;
    try {
      const raw = await readTextFile('config.dd', { baseDir: BaseDirectory.AppConfig });
      const stored = JSON.parse(raw) as StoredConfig;
      const views = Array.isArray(stored.views) ? stored.views : [];
      const selectedIndex = viewNumber - 1;
      if (!views[selectedIndex]) return;

      const nextViews = views.map((view, index) => ({ ...view, active: index === selectedIndex }));
      const nextConfig: StoredConfig = { ...stored, views: nextViews };
      await writeTextFile('config.dd', JSON.stringify(nextConfig, null, 2), { baseDir: BaseDirectory.AppConfig });

      const selectedView = nextViews[selectedIndex];
      const updatePayload = { config: nextConfig };
      const activePayload = {
        viewId: selectedView.id ?? '',
        view: { ...selectedView, widgets: Array.isArray(selectedView.widgets) ? selectedView.widgets : [] },
      };
      await emit('displayduck-update', updatePayload);
      await emitTo('display', 'displayduck-update', updatePayload);
      await emit('displayduck-active-view-updated', activePayload);
      await emitTo('display', 'displayduck-active-view-updated', activePayload);
    } catch (error) {
      console.error('[DisplayDuck View Switcher] failed to switch view', error);
    }
  }
}
