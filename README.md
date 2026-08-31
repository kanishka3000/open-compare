<p align="center">
  <img src="docs/icon.png" width="128" height="128" alt="Open Compare">
</p>

<h1 align="center">Open Compare</h1>

<p align="center">
  A WinMerge-style directory and file comparison tool for macOS.<br>
  Built with TypeScript, Electron and React.
</p>

Point it at two folders, and it shows you a merged tree of everything that is identical, different,
or present on only one side — then a synchronised side-by-side diff of any file you pick, with
word-level highlighting of what actually changed.

**Open Compare never writes to your files.** It opens everything read-only; there is no copy, merge or
delete. Comparing a production folder against a backup cannot damage either one.

![Side-by-side diff in the light theme](docs/screenshot-light.png)

## Features

**Folder comparison**

- Recursive merge of two trees into one list, each entry tagged identical / different / left only /
  right only, with folder status rolled up from its contents.
- Every differing file carries its line change count, `+added −removed`, counted the way
  `git diff --numstat` counts — so a rewritten line shows as one of each. A file present on one side
  only reads as all additions or all removals. Sizes and timestamps move to the row's tooltip.
- Three comparison modes: full **file contents** (SHA-1 over both files), **size and date**, or
  **size only**.
- Exclude and include filters using shell-style patterns (`node_modules`, `*.log`, `*.ts`), plus a
  hidden-file toggle and a non-recursive mode.
- Live progress while scanning, and a Stop button — starting a new comparison cancels the one in
  flight.
- Status filter chips and a name search that hide whole categories or narrow the list as you type.

**File comparison**

- Side-by-side panes with synchronised vertical scrolling and independent horizontal scrolling.
- Myers diff over lines, then word-level diff inside each changed pair, so you see the two characters
  that moved rather than two highlighted lines.
- Ignore options: trailing or all whitespace, letter case, and blank lines. Ignored lines still
  appear in the panes so the line numbers match the file on disk.
- Jump between differences (F7 / Shift-F7), a minimap of every change in the file, and a marker on
  the difference you are currently on.
- Binary files are detected and reported rather than rendered as noise; files present on one side
  only are shown as an all-removed or all-added diff.
- Line-ending detection (LF / CRLF / CR / mixed) per side.

**Interface**

- Native macOS window with an inset title bar, and light and dark palettes that follow the system
  appearance.
- Both the folder tree and the diff panes are virtualised — a 4,000-line diff renders 25 rows and
  scrolls at full speed.
- Folders, options and filters are remembered between launches.

![The same app in the dark theme on a 4,000-line file](docs/screenshot-dark.png)

## Getting started

Requires macOS, Node 20.19+ or 22.12+, and Yarn 1.x.

```bash
yarn install
yarn dev
```

| command | what it does |
| --- | --- |
| `yarn dev` | run the app in development with renderer hot reload |
| `yarn build` | type-check both projects, then bundle main, preload and renderer into `out/` |
| `yarn start` | run the production bundle from `out/` |
| `yarn dist` | build and package macOS `.dmg` installers into `release/` |
| `yarn typecheck` | type-check only |
| `yarn validate` | run the comparison engine headlessly and assert its results |

## Building for macOS

```bash
yarn dist
```

Builds both architectures into `release/` — roughly 260 MB, about a minute on Apple silicon:

| file | for |
| --- | --- |
| `Open Compare-<version>-arm64.dmg` | Apple silicon |
| `Open Compare-<version>.dmg` | Intel |

The unpacked `.app` bundles are left beside them in `release/mac-arm64/` and `release/mac/`, which is
what you want when testing rather than distributing. For a single architecture, pass the flag
through: `yarn build && npx electron-builder --mac --arm64`.

The build is **unsigned**, which is fine on your own machine. A `.dmg` sent over the internet arrives
quarantined, and Gatekeeper reports an unsigned app as "damaged and can't be opened" — misleading
wording for "unsigned", not a corrupt download. Recipients can get past it with right-click › Open.
Distributing properly needs a Developer ID certificate in your keychain and notarisation turned on in
`electron-builder.yml`:

```yaml
mac:
  notarize:
    teamId: XXXXXXXXXX
```

with `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` and `APPLE_TEAM_ID` exported before `yarn dist`.

Troubleshooting:

- **The app will not launch after `yarn install`.** The Electron binary download was skipped — run
  `node node_modules/electron/install.js` to fetch it.
- **`yarn dist` fails with `Unable to detach device cleanly … Resource busy`.** Spotlight or an
  endpoint agent held the disk image open while it was being finalised. The `.app` bundle in
  `release/mac-<arch>/` is already complete; re-running produces the `.dmg`.
- **A type error stops the build but `yarn dev` was fine.** `yarn dev` does not type-check; run
  `yarn typecheck` to see both projects' errors on their own.

## Menu and keyboard

| shortcut | action |
| --- | --- |
| ⌘1 / ⌘2 | choose the left / right folder |
| ⌘↩ | run the comparison |
| F7 / ⇧F7 | next / previous difference |
| ⌘I | show or hide identical files |
| ↑ ↓ | move through the tree |
| → ← | expand / collapse a folder |

## How a comparison is decided

A file pair is **identical** when the chosen mode says so:

| mode | rule |
| --- | --- |
| File contents | sizes match **and** SHA-1 digests match |
| Size and date | sizes match **and** modification times are within 2 seconds |
| Size only | sizes match |

Sizes are always checked first, so a size mismatch short-circuits before any file is read. A folder is
identical when every entry inside it is identical; otherwise it is different, or left/right only when
it exists on one side alone. Files that cannot be read are reported as different and counted in the
status bar rather than failing the whole scan.

**Line change counts.** Only files that actually differ are diffed for their `+added −removed` count;
identical files are skipped, so the cost scales with the number of differences rather than the size of
the tree. Lines are compared exactly there — the ignore-whitespace and ignore-case options belong to
the file you are looking at, not to a folder-wide scan, so the tree always reports the raw change.
The count reads `—` when it would be meaningless (binary content, past the size ceiling, unreadable)
and `0` for files that differ in bytes but not in any line, which is what a pure line-ending change
looks like.

## Architecture

The project follows the layering used across these tools — pure logic in `core/`, all I/O at the
edges, and a thin composition root — mapped onto Electron's three processes:

```
src/
├── core/                  Pure comparison logic. No Electron, no fs, no DOM.
│   ├── FileSystemReader.ts        the port every filesystem must satisfy
│   ├── DirectoryComparer.ts       entry point for a folder comparison
│   ├── DirectoryComparisonRun.ts  one traversal, holds that run's state
│   ├── FileContentComparer.ts     decides identical vs different
│   ├── LineChangeCounter.ts       the +added / −removed shown against each row
│   ├── TextFileProbe.ts           the size ceiling and binary test, shared
│   ├── PathFilter.ts              include / exclude / hidden rules
│   ├── ComparisonTreeFilter.ts    the view filter, shared with the renderer
│   ├── FileDiffBuilder.ts         entry point for a file diff
│   ├── diff/                      Myers, alignment, inline highlighting
│   └── models/                    the types both processes exchange
├── main/                  Electron main process: the I/O adapters and the window.
│   ├── NodeFileSystemReader.ts    the real filesystem, implements the port
│   ├── ComparisonService.ts       one comparison at a time, cancellable
│   ├── FileDiffService.ts
│   ├── IpcRouter.ts               channel wiring
│   └── main.ts                    composition root
├── preload/               contextBridge surface — the only thing the UI can call.
├── renderer/              React UI: tree, diff panes, minimap, options.
├── shared/ipc.ts          The typed contract both sides compile against.
└── validation/            Headless harness: an in-memory filesystem plus assertions.
```

The dependency arrow always points inward. `core/` declares the `FileSystemReader` port;
`main/NodeFileSystemReader` implements it against the disk and `validation/InMemoryFileSystemReader`
implements it against a `Map`, which is what makes the whole engine testable without Electron.

### Classes

```mermaid
classDiagram
    class FileSystemReader {
        <<interface>>
        +listDirectory(path) Promise~DirectoryListing~
        +statFile(path) Promise~FileMetadata~
        +readFileText(path) Promise~string~
        +readFileHead(path, byteCount) Promise~Uint8Array~
        +hashFile(path) Promise~string~
    }
    class NodeFileSystemReader
    class InMemoryFileSystemReader
    NodeFileSystemReader ..|> FileSystemReader
    InMemoryFileSystemReader ..|> FileSystemReader

    class DirectoryComparer {
        +compare(request, listener, cancellation) Promise~DirectoryComparisonResult~
    }
    class DirectoryComparisonRun {
        +execute() Promise~DirectoryComparisonResult~
    }
    class PathFilter {
        +allowsDirectory(name) boolean
        +allowsFile(name) boolean
    }
    class FileContentComparer {
        +areIdentical(leftPath, leftMeta, rightPath, rightMeta) Promise~boolean~
    }
    DirectoryComparer --> DirectoryComparisonRun
    DirectoryComparisonRun --> PathFilter
    DirectoryComparisonRun --> FileContentComparer
    DirectoryComparisonRun --> FileSystemReader
    FileContentComparer --> FileSystemReader

    class FileDiffBuilder {
        +build(request) Promise~FileDiffResult~
    }
    class MyersDiff {
        +compute(left, right) DiffComputation
    }
    class SideBySideAligner {
        +align(operations, left, right) DiffRows
    }
    class InlineDiffer {
        +compare(leftText, rightText) InlineComparison
    }
    class IgnoredLineReinserter
    class DiffBlockIndexer
    class BinaryDetector
    FileDiffBuilder --> FileSystemReader
    FileDiffBuilder --> MyersDiff
    FileDiffBuilder --> SideBySideAligner
    FileDiffBuilder --> IgnoredLineReinserter
    FileDiffBuilder --> DiffBlockIndexer
    FileDiffBuilder --> BinaryDetector
    SideBySideAligner --> InlineDiffer
    InlineDiffer --> MyersDiff

    class IpcRouter
    class ComparisonService
    class FileDiffService
    IpcRouter --> ComparisonService
    IpcRouter --> FileDiffService
    ComparisonService --> DirectoryComparer
    FileDiffService --> FileDiffBuilder
```

### Runtime flow

```mermaid
sequenceDiagram
    actor User
    participant Renderer
    participant Preload
    participant IpcRouter
    participant ComparisonService
    participant DirectoryComparer
    participant FileDiffBuilder
    participant Disk as NodeFileSystemReader

    User->>Renderer: click Compare
    Renderer->>Preload: compareDirectories
    Preload->>IpcRouter: invoke compare-directories
    IpcRouter->>ComparisonService: compare
    ComparisonService->>DirectoryComparer: compare with progress and cancellation
    loop each folder
        DirectoryComparer->>Disk: listDirectory
        Disk-->>DirectoryComparer: folders and files
        loop each file pair
            DirectoryComparer->>Disk: hashFile on both sides
            Disk-->>DirectoryComparer: digests
        end
        DirectoryComparer-->>Renderer: progress
    end
    DirectoryComparer-->>ComparisonService: comparison tree and summary
    ComparisonService-->>Renderer: result
    Renderer->>Renderer: filter, flatten, render the tree

    User->>Renderer: select a file
    Renderer->>IpcRouter: diffFile
    IpcRouter->>FileDiffBuilder: build
    FileDiffBuilder->>Disk: readFileText on both sides
    Disk-->>FileDiffBuilder: text
    FileDiffBuilder->>FileDiffBuilder: myers, align, highlight words
    FileDiffBuilder-->>Renderer: rows, blocks, statistics
    Renderer->>Renderer: render both panes and the minimap
```

## Verifying the engine

`yarn validate` runs the whole comparison engine against an in-memory filesystem and asserts the
results — no window, no disk, no Electron. It covers folder statuses and summaries, all three
comparison modes, the include/exclude/hidden filters, line change counts, diff rows and statistics,
word-level highlighting, the ignore options, binary detection, one-sided files, and diff invariants
over generated inputs (every row set must rebuild both original files exactly, and every equal row
must hold identical text).

```
$ yarn validate
  ✓ Directory comparison › folder rolls up to different
  ✓ Line change counts › one line rewritten plus one appended
  ✓ File diff › word-level highlight on the right
  ✓ Diff invariants › seed 613 rebuilds both sides
  …
57/57 checks passed
```

The command exits non-zero if any check fails, so it drops straight into CI.

## Limits

- Read-only by design: no copy, merge, delete or in-place editing.
- Text comparison is capped at 12 MB per file; larger files report their size instead, and their line
  change count reads `—`.
- Above an edit distance of 2,000 lines the diff falls back to "replace this region" rather than
  spending unbounded memory on the exact edit script.
- Symbolic links are compared as links; they are never followed into their target directory.
- Non-recursive mode lists subfolders without descending into them, so a folder shown as identical
  in that mode only means the folder exists on both sides.
