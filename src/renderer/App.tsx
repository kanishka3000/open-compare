import { useCallback, useEffect, useMemo, useState } from 'react';
import { ComparisonTreeFilter } from '@core/ComparisonTreeFilter';
import type { ComparisonNode } from '@core/models/ComparisonNode';
import type { ComparisonOptions } from '@core/models/ComparisonOptions';
import type { ComparisonStatus } from '@core/models/ComparisonStatus';
import type { DiffOptions } from '@core/models/DiffOptions';
import type { MenuCommand } from '@shared/ipc';
import { DiffPanel, type DiffNavigationRequest, type DiffSelection } from './components/DiffPanel';
import { DirectoryTreePanel } from './components/DirectoryTreePanel';
import { OptionsBar } from './components/OptionsBar';
import { StatusBar } from './components/StatusBar';
import { TitleBar } from './components/TitleBar';
import { useComparison } from './hooks/useComparison';
import { useFileDiff, type FileDiffSelection } from './hooks/useFileDiff';
import { useMenuCommands } from './hooks/useMenuCommands';
import { useSplitPosition } from './hooks/useSplitPosition';
import { DirectoryExpansion } from './model/DirectoryExpansion';
import { FlatTreeBuilder } from './model/FlatTreeBuilder';
import { WorkspaceSettingsStore } from './model/WorkspaceSettingsStore';

const TREE_PANEL_INITIAL_WIDTH = 380;
const TREE_PANEL_MIN_WIDTH = 240;
const TREE_PANEL_MAX_WIDTH = 900;

const settingsStore = new WorkspaceSettingsStore();
const treeFilter = new ComparisonTreeFilter();
const flatTreeBuilder = new FlatTreeBuilder();
const directoryExpansion = new DirectoryExpansion();

export function App(): React.JSX.Element {
  const initialSettings = useMemo(() => settingsStore.load(), []);
  const [leftRoot, setLeftRoot] = useState(initialSettings.leftRoot);
  const [rightRoot, setRightRoot] = useState(initialSettings.rightRoot);
  const [comparisonOptions, setComparisonOptions] = useState<ComparisonOptions>(
    initialSettings.comparisonOptions,
  );
  const [diffOptions, setDiffOptions] = useState<DiffOptions>(initialSettings.diffOptions);
  const [visibleStatuses, setVisibleStatuses] = useState<readonly ComparisonStatus[]>(
    initialSettings.visibleStatuses,
  );
  const [nameQuery, setNameQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<ComparisonNode | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<ReadonlySet<string>>(new Set());
  const [navigationRequest, setNavigationRequest] = useState<DiffNavigationRequest | null>(null);

  const comparison = useComparison();
  const splitter = useSplitPosition(TREE_PANEL_INITIAL_WIDTH, TREE_PANEL_MIN_WIDTH, TREE_PANEL_MAX_WIDTH);

  useEffect(() => {
    settingsStore.save({ leftRoot, rightRoot, comparisonOptions, diffOptions, visibleStatuses });
  }, [leftRoot, rightRoot, comparisonOptions, diffOptions, visibleStatuses]);

  const result = comparison.result;

  useEffect(() => {
    if (!result) {
      return;
    }
    setSelectedNode(null);
    setExpandedPaths(directoryExpansion.pathsWithDifferences(result.children));
  }, [result]);

  const visibleRows = useMemo(() => {
    if (!result) {
      return [];
    }
    const filtered = treeFilter.apply(result.children, { visibleStatuses, nameQuery });
    return flatTreeBuilder.build(filtered, expandedPaths);
  }, [result, visibleStatuses, nameQuery, expandedPaths]);

  const diffSelection = useMemo<(DiffSelection & FileDiffSelection) | null>(() => {
    if (!result || !selectedNode || selectedNode.kind !== 'file') {
      return null;
    }
    return {
      key: selectedNode.relativePath,
      relativePath: selectedNode.relativePath,
      leftPath: selectedNode.left ? `${result.leftRoot}/${selectedNode.relativePath}` : null,
      rightPath: selectedNode.right ? `${result.rightRoot}/${selectedNode.relativePath}` : null,
    };
  }, [result, selectedNode]);

  const diffState = useFileDiff(diffSelection, diffOptions);

  const runComparison = useCallback(() => {
    if (leftRoot && rightRoot) {
      void comparison.run({ leftRoot, rightRoot, options: comparisonOptions });
    }
  }, [comparison, leftRoot, rightRoot, comparisonOptions]);

  const toggleVisibleStatus = useCallback((status: ComparisonStatus) => {
    setVisibleStatuses((current) =>
      current.includes(status) ? current.filter((entry) => entry !== status) : [...current, status],
    );
  }, []);

  const setExpanded = useCallback((relativePath: string, expanded: boolean) => {
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (expanded) {
        next.add(relativePath);
      } else {
        next.delete(relativePath);
      }
      return next;
    });
  }, []);

  const toggleExpanded = useCallback((relativePath: string) => {
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (!next.delete(relativePath)) {
        next.add(relativePath);
      }
      return next;
    });
  }, []);

  const selectFolder = useCallback(async (side: 'left' | 'right') => {
    const chosen = await window.macCompare.selectFolder(`Select the ${side} folder`);
    if (!chosen) {
      return;
    }
    (side === 'left' ? setLeftRoot : setRightRoot)(chosen);
  }, []);

  useMenuCommands(
    useCallback(
      (command: MenuCommand) => {
        switch (command) {
          case 'select-left-folder':
            void selectFolder('left');
            break;
          case 'select-right-folder':
            void selectFolder('right');
            break;
          case 'run-comparison':
            runComparison();
            break;
          case 'next-difference':
            setNavigationRequest((current) => ({ direction: 'next', token: (current?.token ?? 0) + 1 }));
            break;
          case 'previous-difference':
            setNavigationRequest((current) => ({
              direction: 'previous',
              token: (current?.token ?? 0) + 1,
            }));
            break;
          case 'toggle-identical-files':
            toggleVisibleStatus('identical');
            break;
        }
      },
      [selectFolder, runComparison, toggleVisibleStatus],
    ),
  );

  const swapRoots = useCallback(() => {
    setLeftRoot(rightRoot);
    setRightRoot(leftRoot);
  }, [leftRoot, rightRoot]);

  return (
    <div className="app">
      <TitleBar
        leftRoot={leftRoot}
        rightRoot={rightRoot}
        isComparing={comparison.isComparing}
        onLeftRootChange={setLeftRoot}
        onRightRootChange={setRightRoot}
        onSwapRoots={swapRoots}
        onCompare={runComparison}
        onCancel={comparison.cancel}
      />
      <OptionsBar
        options={comparisonOptions}
        summary={result?.summary ?? null}
        visibleStatuses={visibleStatuses}
        nameQuery={nameQuery}
        onOptionsChange={setComparisonOptions}
        onVisibleStatusToggle={toggleVisibleStatus}
        onNameQueryChange={setNameQuery}
      />
      <div className="app__body">
        <DirectoryTreePanel
          rows={visibleRows}
          selectedPath={selectedNode?.relativePath ?? null}
          isComparing={comparison.isComparing}
          progress={comparison.progress}
          width={splitter.width}
          onSelect={setSelectedNode}
          onToggleExpanded={toggleExpanded}
          onSetExpanded={setExpanded}
        />
        <div
          className={splitter.isDragging ? 'app__splitter app__splitter--active' : 'app__splitter'}
          onMouseDown={splitter.beginDrag}
        />
        <DiffPanel
          selection={diffSelection}
          diffState={diffState}
          options={diffOptions}
          navigationRequest={navigationRequest}
          onOptionsChange={setDiffOptions}
        />
      </div>
      <StatusBar
        summary={result?.summary ?? null}
        unreadablePathCount={result?.unreadablePaths.length ?? 0}
        errorMessage={comparison.errorMessage}
        isComparing={comparison.isComparing}
      />
    </div>
  );
}
