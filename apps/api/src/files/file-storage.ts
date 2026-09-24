export interface StoredObject {
  key: string;
  sizeBytes: number;
  sha256: string;
}

export interface FileStorage {
  write(buffer: Buffer): Promise<StoredObject>;
  pathFor(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

export const FILE_STORAGE = Symbol('FILE_STORAGE');
