import { join } from 'node:path';
import { BrowserWindow, shell } from 'electron';

const WINDOW_DEFAULTS = {
  width: 1440,
  height: 900,
  minWidth: 900,
  minHeight: 560,
  backgroundColor: '#1b1d21',
};

export class ApplicationWindow {
  private window: BrowserWindow | null = null;

  create(): BrowserWindow {
    const window = new BrowserWindow({
      ...WINDOW_DEFAULTS,
      show: false,
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 16, y: 18 },
      webPreferences: {
        preload: join(__dirname, '../preload/preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    window.once('ready-to-show', () => window.show());
    window.on('closed', () => {
      this.window = null;
    });
    this.openExternalLinksInBrowser(window);
    this.loadRenderer(window);

    this.window = window;
    return window;
  }

  get current(): BrowserWindow | null {
    return this.window;
  }

  focusOrCreate(): BrowserWindow {
    if (!this.window) {
      return this.create();
    }
    this.window.focus();
    return this.window;
  }

  private loadRenderer(window: BrowserWindow): void {
    const developmentUrl = process.env['ELECTRON_RENDERER_URL'];
    if (developmentUrl) {
      void window.loadURL(developmentUrl);
      return;
    }
    void window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  private openExternalLinksInBrowser(window: BrowserWindow): void {
    window.webContents.setWindowOpenHandler(({ url }) => {
      void shell.openExternal(url);
      return { action: 'deny' };
    });
  }
}
