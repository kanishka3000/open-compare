import { DirectoryComparer } from '../core/DirectoryComparer';
import { FileDiffBuilder } from '../core/FileDiffBuilder';
import type { ComparisonNode, LineChangeCount } from '../core/models/ComparisonNode';
import { DEFAULT_COMPARISON_OPTIONS } from '../core/models/ComparisonOptions';
import { DEFAULT_DIFF_OPTIONS } from '../core/models/DiffOptions';
import type { DiffRow } from '../core/models/FileDiffResult';
import { InMemoryFileSystemReader, type InMemoryFile } from './InMemoryFileSystemReader';
import { LEFT_ROOT, RIGHT_ROOT, buildFixtureFileSystem } from './fixtures';
import { ValidationReport } from './ValidationReport';

const FIXTURE_MODIFIED_AT_MS = 1_700_000_000_000;

async function main(): Promise<void> {
  const report = new ValidationReport();
  const fileSystem = new InMemoryFileSystemReader(buildFixtureFileSystem());

  await validateDirectoryComparison(report, fileSystem);
  await validateLineChangeCounts(report, fileSystem);
  await validateComparisonModes(report, fileSystem);
  await validateFilters(report, fileSystem);
  await validateFileDiff(report, fileSystem);
  await validateDiffOptions(report, fileSystem);
  await validateNonTextFiles(report, fileSystem);
  await validateDiffInvariants(report);

  report.print();
  process.exitCode = report.hasFailures ? 1 : 0;
}

async function validateDirectoryComparison(
  report: ValidationReport,
  fileSystem: InMemoryFileSystemReader,
): Promise<void> {
  report.section('Directory comparison');
  const result = await new DirectoryComparer(fileSystem).compare({
    leftRoot: LEFT_ROOT,
    rightRoot: RIGHT_ROOT,
    options: DEFAULT_COMPARISON_OPTIONS,
  });

  report.expect('identical content wins over differing timestamps', statusOf(result.children, 'README.md'), 'identical');
  report.expect('modified file', statusOf(result.children, 'src/app.ts'), 'different');
  report.expect('file missing on the right', statusOf(result.children, 'src/only-left.ts'), 'left-only');
  report.expect('file missing on the left', statusOf(result.children, 'src/only-right.ts'), 'right-only');
  report.expect('untouched nested file', statusOf(result.children, 'shared/same.txt'), 'identical');
  report.expect('folder rolls up to different', statusOf(result.children, 'src'), 'different');
  report.expect('folder rolls up to identical', statusOf(result.children, 'shared'), 'identical');
  report.expect('excluded folder is skipped', statusOf(result.children, 'node_modules'), 'absent');
  report.expect('hidden file is skipped', statusOf(result.children, '.hidden-notes'), 'absent');
  report.expect('summary', result.summary, {
    identical: 2,
    different: 4,
    leftOnly: 1,
    rightOnly: 1,
    directories: 3,
  });
  report.expect('no unreadable paths', result.unreadablePaths.length, 0);
}

async function validateLineChangeCounts(
  report: ValidationReport,
  fileSystem: InMemoryFileSystemReader,
): Promise<void> {
  report.section('Line change counts');
  const result = await new DirectoryComparer(fileSystem).compare({
    leftRoot: LEFT_ROOT,
    rightRoot: RIGHT_ROOT,
    options: DEFAULT_COMPARISON_OPTIONS,
  });

  report.expect('identical file reports no change', lineChangesOf(result.children, 'README.md'), {
    added: 0,
    removed: 0,
  });
  report.expect('one line rewritten plus one appended', lineChangesOf(result.children, 'src/app.ts'), {
    added: 2,
    removed: 1,
  });
  report.expect('file only on the left is all removals', lineChangesOf(result.children, 'src/only-left.ts'), {
    added: 0,
    removed: 1,
  });
  report.expect('file only on the right is all additions', lineChangesOf(result.children, 'src/only-right.ts'), {
    added: 1,
    removed: 0,
  });
  report.expect('case and whitespace edits count as line changes', lineChangesOf(result.children, 'src/style.css'), {
    added: 3,
    removed: 2,
  });
  report.expect('binary file is not counted', lineChangesOf(result.children, 'assets/icon.bin'), null);
  report.expect(
    'files differing only in line endings change no line',
    lineChangesOf(result.children, 'src/endings.txt'),
    { added: 0, removed: 0 },
  );
  report.expect(
    'a line-ending-only difference is still a difference',
    statusOf(result.children, 'src/endings.txt'),
    'different',
  );
}

async function validateComparisonModes(
  report: ValidationReport,
  fileSystem: InMemoryFileSystemReader,
): Promise<void> {
  report.section('Comparison modes');
  const comparer = new DirectoryComparer(fileSystem);

  const byTimestamp = await comparer.compare({
    leftRoot: LEFT_ROOT,
    rightRoot: RIGHT_ROOT,
    options: { ...DEFAULT_COMPARISON_OPTIONS, contentComparisonMode: 'size-and-time' },
  });
  report.expect(
    'size-and-time notices the newer copy',
    statusOf(byTimestamp.children, 'README.md'),
    'different',
  );

  const nonRecursive = await comparer.compare({
    leftRoot: LEFT_ROOT,
    rightRoot: RIGHT_ROOT,
    options: { ...DEFAULT_COMPARISON_OPTIONS, recursive: false },
  });
  report.expect('non-recursive compares the root only', nonRecursive.summary.identical, 1);
  report.expect('non-recursive does not descend', statusOf(nonRecursive.children, 'src/app.ts'), 'absent');
}

async function validateFilters(
  report: ValidationReport,
  fileSystem: InMemoryFileSystemReader,
): Promise<void> {
  report.section('Filters');
  const comparer = new DirectoryComparer(fileSystem);

  const typescriptOnly = await comparer.compare({
    leftRoot: LEFT_ROOT,
    rightRoot: RIGHT_ROOT,
    options: { ...DEFAULT_COMPARISON_OPTIONS, includedNamePatterns: ['*.ts'] },
  });
  report.expect('only *.ts survives the include filter', statusOf(typescriptOnly.children, 'README.md'), 'absent');
  report.expect('matching file is kept', statusOf(typescriptOnly.children, 'src/app.ts'), 'different');

  const withHidden = await comparer.compare({
    leftRoot: LEFT_ROOT,
    rightRoot: RIGHT_ROOT,
    options: { ...DEFAULT_COMPARISON_OPTIONS, includeHiddenEntries: true },
  });
  report.expect('hidden files appear when asked for', statusOf(withHidden.children, '.hidden-notes'), 'left-only');
}

async function validateFileDiff(
  report: ValidationReport,
  fileSystem: InMemoryFileSystemReader,
): Promise<void> {
  report.section('File diff');
  const diff = await new FileDiffBuilder(fileSystem).build({
    leftPath: `${LEFT_ROOT}/src/app.ts`,
    rightPath: `${RIGHT_ROOT}/src/app.ts`,
    options: DEFAULT_DIFF_OPTIONS,
  });

  report.expect('kind', diff.kind, 'text');
  report.expect('row kinds', diff.rows.map((row) => row.kind), ['equal', 'changed', 'equal', 'added']);
  report.expect('statistics', diff.statistics, {
    equalLines: 2,
    changedLines: 1,
    addedLines: 1,
    removedLines: 0,
  });
  report.expect('difference blocks', diff.blocks, [
    { firstRowIndex: 1, lastRowIndex: 1 },
    { firstRowIndex: 3, lastRowIndex: 3 },
  ]);
  report.expect('left line count', diff.left.lineCount, 3);
  report.expect('right line count', diff.right.lineCount, 4);
  report.expect('line ending detected', diff.left.lineEnding, 'lf');
  report.expect('changed text on the left', diff.rows[1]?.left?.text, 'const b = 2;');
  report.expect('changed text on the right', diff.rows[1]?.right?.text, 'const b = 20;');
  report.expect('word-level highlight on the left', changedText(diff.rows[1], 'left'), '2');
  report.expect('word-level highlight on the right', changedText(diff.rows[1], 'right'), '20');
}

async function validateDiffOptions(
  report: ValidationReport,
  fileSystem: InMemoryFileSystemReader,
): Promise<void> {
  report.section('Diff options');
  const builder = new FileDiffBuilder(fileSystem);
  const paths = { leftPath: `${LEFT_ROOT}/src/style.css`, rightPath: `${RIGHT_ROOT}/src/style.css` };

  const strict = await builder.build({ ...paths, options: DEFAULT_DIFF_OPTIONS });
  report.expectTrue('strict comparison reports differences', strict.blocks.length > 0);

  const relaxed = await builder.build({
    ...paths,
    options: {
      ...DEFAULT_DIFF_OPTIONS,
      ignoreCase: true,
      whitespaceSensitivity: 'ignore-all',
      ignoreBlankLines: true,
    },
  });
  report.expect('relaxed comparison finds no differences', relaxed.blocks.length, 0);
  report.expect('ignored blank line is still displayed', relaxed.rows.length, 4);
  assertRowsReconstructFiles(
    report,
    'ignored lines keep both files intact',
    relaxed.rows,
    ['body {', '  color: red;', '}'],
    ['BODY {', '\tcolor: red;', '', '}'],
  );
}

async function validateNonTextFiles(
  report: ValidationReport,
  fileSystem: InMemoryFileSystemReader,
): Promise<void> {
  report.section('Non-text files');
  const builder = new FileDiffBuilder(fileSystem);

  const binary = await builder.build({
    leftPath: `${LEFT_ROOT}/assets/icon.bin`,
    rightPath: `${RIGHT_ROOT}/assets/icon.bin`,
    options: DEFAULT_DIFF_OPTIONS,
  });
  report.expect('binary files are detected', binary.kind, 'binary');
  report.expectTrue('binary files carry an explanation', (binary.message ?? '').length > 0);

  const oneSided = await builder.build({
    leftPath: `${LEFT_ROOT}/src/only-left.ts`,
    rightPath: null,
    options: DEFAULT_DIFF_OPTIONS,
  });
  report.expect('file present on one side only', oneSided.kind, 'text');
  report.expect('every line reads as removed', oneSided.statistics.removedLines, 1);
  report.expect('missing side is flagged', oneSided.right.exists, false);
}

async function validateDiffInvariants(report: ValidationReport): Promise<void> {
  report.section('Diff invariants');

  for (const seed of [1, 7, 41, 613]) {
    const leftLines = pseudoRandomLines(seed, 60);
    const rightLines = mutateLines(leftLines, seed + 1);
    const files = new Map<string, InMemoryFile>([
      ['/pair/left.txt', { content: `${leftLines.join('\n')}\n`, modifiedAtMs: FIXTURE_MODIFIED_AT_MS }],
      ['/pair/right.txt', { content: `${rightLines.join('\n')}\n`, modifiedAtMs: FIXTURE_MODIFIED_AT_MS }],
    ]);

    const diff = await new FileDiffBuilder(new InMemoryFileSystemReader(files)).build({
      leftPath: '/pair/left.txt',
      rightPath: '/pair/right.txt',
      options: DEFAULT_DIFF_OPTIONS,
    });

    assertRowsReconstructFiles(report, `seed ${seed} rebuilds both sides`, diff.rows, leftLines, rightLines);
    report.expectTrue(
      `seed ${seed} equal rows really are equal`,
      diff.rows.every((row) => row.kind !== 'equal' || row.left?.text === row.right?.text),
    );
    report.expectTrue(
      `seed ${seed} segments cover every character`,
      diff.rows.every((row) => cellSegmentsMatchText(row) === true),
    );
  }
}

function assertRowsReconstructFiles(
  report: ValidationReport,
  name: string,
  rows: readonly DiffRow[],
  leftLines: readonly string[],
  rightLines: readonly string[],
): void {
  const rebuiltLeft = rows.map((row) => row.left).filter(isPresent);
  const rebuiltRight = rows.map((row) => row.right).filter(isPresent);

  const leftMatches =
    rebuiltLeft.length === leftLines.length &&
    rebuiltLeft.every((cell, index) => cell.text === leftLines[index] && cell.lineNumber === index + 1);
  const rightMatches =
    rebuiltRight.length === rightLines.length &&
    rebuiltRight.every((cell, index) => cell.text === rightLines[index] && cell.lineNumber === index + 1);

  report.expectTrue(
    name,
    leftMatches && rightMatches,
    `left ${rebuiltLeft.length}/${leftLines.length}, right ${rebuiltRight.length}/${rightLines.length}`,
  );
}

function cellSegmentsMatchText(row: DiffRow): boolean {
  return [row.left, row.right]
    .filter(isPresent)
    .every((cell) => cell.segments.map((segment) => segment.text).join('') === cell.text);
}

function changedText(row: DiffRow | undefined, side: 'left' | 'right'): string {
  const cell = side === 'left' ? row?.left : row?.right;
  return (cell?.segments ?? [])
    .filter((segment) => segment.changed)
    .map((segment) => segment.text)
    .join('');
}

function statusOf(nodes: readonly ComparisonNode[], relativePath: string): string {
  return findNode(nodes, relativePath)?.status ?? 'absent';
}

function lineChangesOf(
  nodes: readonly ComparisonNode[],
  relativePath: string,
): LineChangeCount | null | 'absent' {
  const node = findNode(nodes, relativePath);
  return node?.kind === 'file' ? node.lineChanges : 'absent';
}

function findNode(nodes: readonly ComparisonNode[], relativePath: string): ComparisonNode | null {
  for (const node of nodes) {
    if (node.relativePath === relativePath) {
      return node;
    }
    if (node.kind === 'directory' && relativePath.startsWith(`${node.relativePath}/`)) {
      const match = findNode(node.children, relativePath);
      if (match) {
        return match;
      }
    }
  }
  return null;
}

function isPresent<TValue>(value: TValue | null): value is TValue {
  return value !== null;
}

function pseudoRandomLines(seed: number, count: number): string[] {
  const random = createRandom(seed);
  return Array.from({ length: count }, (_, index) => `line ${index} value ${random(1000)}`);
}

function mutateLines(lines: readonly string[], seed: number): string[] {
  const random = createRandom(seed);
  const mutated: string[] = [];
  for (const line of lines) {
    const action = random(10);
    if (action < 2) {
      continue;
    }
    if (action < 4) {
      mutated.push(`${line} // edited`);
      continue;
    }
    if (action < 5) {
      mutated.push(`inserted ${random(1000)}`);
    }
    mutated.push(line);
  }
  return mutated;
}

function createRandom(seed: number): (bound: number) => number {
  let state = seed;
  return (bound: number) => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return Math.abs(state) % bound;
  };
}

void main();
