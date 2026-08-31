import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { ComparisonProgress } from '../core/models/DirectoryComparisonResult';
import {
  IPC_CHANNEL,
  type CompareDirectoriesRequest,
  type DiffFileRequest,
  type OpenCompareApi,
  type MenuCommand,
} from '../shared/ipc';

function subscribe<TPayload>(channel: string, listener: (payload: TPayload) => void): () => void {
  const handler = (_event: IpcRendererEvent, payload: TPayload): void => listener(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.off(channel, handler);
}

const api: OpenCompareApi = {
  selectFolder: (dialogTitle: string) => ipcRenderer.invoke(IPC_CHANNEL.selectFolder, dialogTitle),
  compareDirectories: (request: CompareDirectoriesRequest) =>
    ipcRenderer.invoke(IPC_CHANNEL.compareDirectories, request),
  cancelComparison: () => ipcRenderer.invoke(IPC_CHANNEL.cancelComparison),
  diffFile: (request: DiffFileRequest) => ipcRenderer.invoke(IPC_CHANNEL.diffFile, request),
  revealInFinder: (absolutePath: string) => ipcRenderer.invoke(IPC_CHANNEL.revealInFinder, absolutePath),
  onComparisonProgress: (listener: (progress: ComparisonProgress) => void) =>
    subscribe(IPC_CHANNEL.comparisonProgress, listener),
  onMenuCommand: (listener: (command: MenuCommand) => void) =>
    subscribe(IPC_CHANNEL.menuCommand, listener),
};

contextBridge.exposeInMainWorld('openCompare', api);
