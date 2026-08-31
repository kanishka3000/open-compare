# Architecture

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

## Classes

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

## Runtime flow

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

---

[← back to the readme](../README.md)
