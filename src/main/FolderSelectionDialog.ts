import { dialog, type BrowserWindow } from 'electron';

export class FolderSelectionDialog {
  async prompt(parentWindow: BrowserWindow | null, dialogTitle: string): Promise<string | null> {
    const options = {
      title: dialogTitle,
      buttonLabel: 'Choose Folder',
      properties: ['openDirectory' as const, 'createDirectory' as const],
    };
    const selection = parentWindow
      ? await dialog.showOpenDialog(parentWindow, options)
      : await dialog.showOpenDialog(options);

    return selection.canceled ? null : (selection.filePaths[0] ?? null);
  }
}
