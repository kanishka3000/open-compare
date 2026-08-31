import { describeStatus } from '@core/models/ComparisonStatus';
import type { ComparisonNode, LineChangeCount } from '@core/models/ComparisonNode';
import type { FlatTreeRow } from '../model/FlatTreeBuilder';
import { formatBytes, formatTimestamp } from '../model/formatters';

const INDENT_PER_LEVEL_PX = 14;
const BASE_INDENT_PX = 8;
const UNKNOWN_LINE_CHANGES = '—';
const NO_LINE_CHANGES = '0';

interface TreeRowProps {
  readonly row: FlatTreeRow;
  readonly isSelected: boolean;
  readonly onSelect: (node: ComparisonNode) => void;
  readonly onToggleExpanded: (relativePath: string) => void;
}

export function TreeRow({ row, isSelected, onSelect, onToggleExpanded }: TreeRowProps): React.JSX.Element {
  const { node } = row;

  return (
    <div
      className={isSelected ? 'tree-row tree-row--selected' : 'tree-row'}
      style={{ paddingLeft: BASE_INDENT_PX + row.depth * INDENT_PER_LEVEL_PX }}
      title={describeRow(node)}
      onClick={() => onSelect(node)}
    >
      <span
        className="tree-row__twisty"
        onClick={(event) => {
          event.stopPropagation();
          if (row.isExpandable) {
            onToggleExpanded(node.relativePath);
          }
        }}
      >
        {row.isExpandable ? (row.isExpanded ? '▼' : '▶') : ''}
      </span>
      <span className="tree-row__icon">{node.kind === 'directory' ? '📁' : '📄'}</span>
      <span className={`tree-row__status tree-row__status--${node.status}`} />
      <span className="tree-row__name">{node.name}</span>
      <span className="tree-row__meta">{renderLineChanges(node)}</span>
    </div>
  );
}

function renderLineChanges(node: ComparisonNode): React.ReactNode {
  if (node.kind === 'directory' || node.status === 'identical') {
    return null;
  }
  if (node.lineChanges === null) {
    return UNKNOWN_LINE_CHANGES;
  }
  const { added, removed } = node.lineChanges;
  if (added === 0 && removed === 0) {
    return NO_LINE_CHANGES;
  }
  return (
    <>
      {added > 0 ? <span className="tree-row__added">{`+${added}`}</span> : null}
      {removed > 0 ? <span className="tree-row__removed">{`-${removed}`}</span> : null}
    </>
  );
}

function describeRow(node: ComparisonNode): string {
  const lines = [`${node.relativePath} — ${describeStatus(node.status)}`];
  if (node.kind === 'file') {
    lines.push(`Lines: ${describeLineChanges(node.status, node.lineChanges)}`);
    lines.push(`Left: ${describeSide(node.left)}`);
    lines.push(`Right: ${describeSide(node.right)}`);
  }
  return lines.join('\n');
}

function describeLineChanges(status: string, lineChanges: LineChangeCount | null): string {
  if (status === 'identical') {
    return 'unchanged';
  }
  if (lineChanges === null) {
    return 'not counted (binary, too large, or unreadable)';
  }
  if (lineChanges.added === 0 && lineChanges.removed === 0) {
    return 'no line changed — the files differ only in line endings';
  }
  return `${lineChanges.added} added, ${lineChanges.removed} removed`;
}

function describeSide(metadata: { sizeBytes: number; modifiedAtMs: number } | null): string {
  if (!metadata) {
    return 'missing';
  }
  return `${formatBytes(metadata.sizeBytes)}, modified ${formatTimestamp(metadata.modifiedAtMs)}`;
}
