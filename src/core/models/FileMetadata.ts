export interface FileMetadata {
  readonly name: string;
  readonly sizeBytes: number;
  readonly modifiedAtMs: number;
}

export interface DirectoryMetadata {
  readonly name: string;
}

export interface DirectoryListing {
  readonly directories: readonly DirectoryMetadata[];
  readonly files: readonly FileMetadata[];
}

export const EMPTY_DIRECTORY_LISTING: DirectoryListing = { directories: [], files: [] };
