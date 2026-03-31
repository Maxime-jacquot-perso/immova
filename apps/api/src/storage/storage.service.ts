import { Injectable, NotFoundException } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

@Injectable()
export class StorageService {
  private readonly uploadDir = process.env.UPLOAD_DIR || './uploads';

  async save(storageKey: string, buffer: Buffer) {
    const absolutePath = join(this.uploadDir, storageKey);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);
  }

  async openReadStream(storageKey: string) {
    const absolutePath = join(this.uploadDir, storageKey);

    try {
      await stat(absolutePath);
    } catch {
      throw new NotFoundException('File not found');
    }

    return createReadStream(absolutePath);
  }
}
