import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { Environment } from '../config/environment';
import { FileStorage, StoredObject } from './file-storage';

@Injectable()
export class LocalFileStorageService implements FileStorage, OnModuleInit {
  private readonly root: string;

  constructor(config: ConfigService<Environment, true>) {
    const configured = config.get('FILE_STORAGE_PATH', { infer: true });
    this.root = isAbsolute(configured)
      ? resolve(configured)
      : resolve(process.cwd(), configured);
  }

  async onModuleInit() {
    await mkdir(this.root, { recursive: true });
  }

  async write(buffer: Buffer): Promise<StoredObject> {
    const id = randomUUID();
    const directory = join(this.root, id.slice(0, 2));
    const finalPath = join(directory, id);
    const temporaryPath = `${finalPath}.uploading`;
    await mkdir(directory, { recursive: true });
    try {
      await writeFile(temporaryPath, buffer, { flag: 'wx', mode: 0o600 });
      await rename(temporaryPath, finalPath);
    } catch (error) {
      await unlink(temporaryPath).catch(() => undefined);
      throw error;
    }
    return {
      key: `${id.slice(0, 2)}/${id}`,
      sizeBytes: buffer.length,
      sha256: createHash('sha256').update(buffer).digest('hex'),
    };
  }

  async pathFor(key: string): Promise<string> {
    if (!/^[a-f0-9]{2}\/[a-f0-9-]{36}$/.test(key)) {
      throw new NotFoundException('Stored file not found');
    }
    const filePath = resolve(this.root, key);
    const pathFromRoot = relative(this.root, filePath);
    if (pathFromRoot.startsWith('..') || isAbsolute(pathFromRoot)) {
      throw new NotFoundException('Stored file not found');
    }
    try {
      await stat(filePath);
    } catch {
      throw new NotFoundException('Stored file not found');
    }
    return filePath;
  }

  async delete(key: string): Promise<void> {
    const filePath = resolve(this.root, key);
    const pathFromRoot = relative(this.root, filePath);
    if (pathFromRoot.startsWith('..') || isAbsolute(pathFromRoot)) return;
    await unlink(filePath).catch(() => undefined);
  }
}
