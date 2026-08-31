import type { InMemoryFile } from './InMemoryFileSystemReader';

export const LEFT_ROOT = '/left';
export const RIGHT_ROOT = '/right';

const BASE_MODIFIED_AT_MS = 1_700_000_000_000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const BINARY_MARKER = 'PNG\u0000\u0000\u0000';

function file(content: string, modifiedAtMs = BASE_MODIFIED_AT_MS): InMemoryFile {
  return { content, modifiedAtMs };
}

export const LEFT_APP_SOURCE = 'const a = 1;\nconst b = 2;\nconst c = 3;\n';
export const RIGHT_APP_SOURCE = 'const a = 1;\nconst b = 20;\nconst c = 3;\nconst d = 4;\n';

export function buildFixtureFileSystem(): Map<string, InMemoryFile> {
  return new Map<string, InMemoryFile>([
    [`${LEFT_ROOT}/README.md`, file('# Project\nHello\n')],
    [`${LEFT_ROOT}/.hidden-notes`, file('secret\n')],
    [`${LEFT_ROOT}/src/app.ts`, file(LEFT_APP_SOURCE)],
    [`${LEFT_ROOT}/src/only-left.ts`, file('export const left = true;\n')],
    [`${LEFT_ROOT}/src/style.css`, file('body {\n  color: red;\n}\n')],
    [`${LEFT_ROOT}/src/endings.txt`, file('alpha\nbeta\ngamma\n')],
    [`${LEFT_ROOT}/shared/same.txt`, file('same\n')],
    [`${LEFT_ROOT}/assets/icon.bin`, file(BINARY_MARKER + 'binary')],
    [`${LEFT_ROOT}/node_modules/pkg/index.js`, file('module.exports = 1;\n')],

    [`${RIGHT_ROOT}/README.md`, file('# Project\nHello\n', BASE_MODIFIED_AT_MS + ONE_HOUR_MS)],
    [`${RIGHT_ROOT}/src/app.ts`, file(RIGHT_APP_SOURCE)],
    [`${RIGHT_ROOT}/src/only-right.ts`, file('export const right = true;\n')],
    [`${RIGHT_ROOT}/src/style.css`, file('BODY {\n\tcolor: red;\n\n}\n')],
    [`${RIGHT_ROOT}/src/endings.txt`, file('alpha\r\nbeta\r\ngamma\r\n')],
    [`${RIGHT_ROOT}/shared/same.txt`, file('same\n')],
    [`${RIGHT_ROOT}/assets/icon.bin`, file(BINARY_MARKER + 'different')],
    [`${RIGHT_ROOT}/node_modules/pkg/index.js`, file('module.exports = 2;\n')],
  ]);
}
