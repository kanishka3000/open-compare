import { Menu, app, type BrowserWindow, type MenuItemConstructorOptions } from 'electron';
import { IPC_CHANNEL, type MenuCommand } from '../shared/ipc';

export class ApplicationMenu {
  constructor(private readonly resolveWindow: () => BrowserWindow | null) {}

  install(): void {
    Menu.setApplicationMenu(Menu.buildFromTemplate(this.buildTemplate()));
  }

  private buildTemplate(): MenuItemConstructorOptions[] {
    return [
      { role: 'appMenu' },
      this.compareMenu(),
      this.viewMenu(),
      { role: 'windowMenu' },
    ];
  }

  private compareMenu(): MenuItemConstructorOptions {
    return {
      label: 'Compare',
      submenu: [
        this.commandItem('Select Left Folder…', 'CommandOrControl+1', 'select-left-folder'),
        this.commandItem('Select Right Folder…', 'CommandOrControl+2', 'select-right-folder'),
        { type: 'separator' },
        this.commandItem('Compare Folders', 'CommandOrControl+Return', 'run-comparison'),
        { type: 'separator' },
        this.commandItem('Next Difference', 'F7', 'next-difference'),
        this.commandItem('Previous Difference', 'Shift+F7', 'previous-difference'),
      ],
    };
  }

  private viewMenu(): MenuItemConstructorOptions {
    return {
      label: 'View',
      submenu: [
        this.commandItem('Show Identical Files', 'CommandOrControl+I', 'toggle-identical-files'),
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...this.developerItems(),
      ],
    };
  }

  private developerItems(): MenuItemConstructorOptions[] {
    return app.isPackaged ? [] : [{ type: 'separator' }, { role: 'toggleDevTools' }, { role: 'reload' }];
  }

  private commandItem(
    label: string,
    accelerator: string,
    command: MenuCommand,
  ): MenuItemConstructorOptions {
    return { label, accelerator, click: () => this.dispatch(command) };
  }

  private dispatch(command: MenuCommand): void {
    const window = this.resolveWindow();
    if (window && !window.webContents.isDestroyed()) {
      window.webContents.send(IPC_CHANNEL.menuCommand, command);
    }
  }
}
