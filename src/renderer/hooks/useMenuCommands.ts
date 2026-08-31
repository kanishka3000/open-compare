import { useEffect, useRef } from 'react';
import type { MenuCommand } from '@shared/ipc';

export function useMenuCommands(handler: (command: MenuCommand) => void): void {
  const latestHandler = useRef(handler);
  latestHandler.current = handler;

  useEffect(() => window.macCompare.onMenuCommand((command) => latestHandler.current(command)), []);
}
