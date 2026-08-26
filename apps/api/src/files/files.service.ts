import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, WorkspaceFileScope } from '@prisma/client';
import { extname } from 'node:path';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/auth-user';
import { Environment } from '../config/environment';
import { PrismaService } from '../prisma/prisma.service';
import { FileListQueryDto, UploadWorkspaceFileDto } from './dto/files.dto';
import { FILE_STORAGE } from './file-storage';
import type { FileStorage } from './file-storage';

export interface UploadedWorkspaceFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const binaryTypes = [
  {
    mime: 'application/pdf',
    extensions: ['.pdf'],
    matches: (value: Buffer) => value.subarray(0, 5).toString() === '%PDF-',
  },
  {
    mime: 'image/png',
    extensions: ['.png'],
    matches: (value: Buffer) =>
      value.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')),
  },
  {
    mime: 'image/jpeg',
    extensions: ['.jpg', '.jpeg'],
    matches: (value: Buffer) =>
      value.length >= 3 &&
      value[0] === 0xff &&
      value[1] === 0xd8 &&
      value[2] === 0xff,
  },
  {
    mime: 'image/webp',
    extensions: ['.webp'],
    matches: (value: Buffer) =>
      value.subarray(0, 4).toString() === 'RIFF' &&
      value.subarray(8, 12).toString() === 'WEBP',
  },
];

@Injectable()
export class FilesService {
  private readonly maxSize: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    config: ConfigService<Environment, true>,
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
  ) {
    this.maxSize = config.get('FILE_MAX_SIZE_BYTES', { infer: true });
  }

  async list(user: AuthenticatedUser, query: FileListQueryDto) {
    const visibility = this.visibilityWhere(user);
    const search = query.search?.trim();
    const where: Prisma.FileRecordWhereInput = {
      workspaceAttachments: {
        some: {
          AND: [visibility, ...(query.scope ? [{ scope: query.scope }] : [])],
        },
      },
      ...(search && {
        originalName: { contains: search, mode: 'insensitive' },
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.fileRecord.findMany({
        where,
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
          sha256: true,
          createdAt: true,
          uploadedBy: { select: { id: true, fullName: true } },
          workspaceAttachments: {
            select: {
              id: true,
              scope: true,
              branch: { select: { id: true, name: true, code: true } },
              department: { select: { id: true, name: true, code: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.fileRecord.count({ where }),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }

  async upload(
    file: UploadedWorkspaceFile | undefined,
    input: UploadWorkspaceFileDto,
    user: AuthenticatedUser,
    ipAddress?: string,
  ) {
    if (!file?.buffer?.length) throw new BadRequestException('Choose a file');
    if (file.size > this.maxSize) {
      throw new BadRequestException('File exceeds the configured size limit');
    }
    const originalName = this.cleanFilename(file.originalname);
    const mimeType = this.detectType(file.buffer, originalName);
    const assignment = this.scopeAssignment(input.scope, user);
    const stored = await this.storage.write(file.buffer);
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const record = await transaction.fileRecord.create({
          data: {
            originalName,
            storageKey: stored.key,
            mimeType,
            sizeBytes: stored.sizeBytes,
            sha256: stored.sha256,
            uploadedById: user.id,
            workspaceAttachments: {
              create: { scope: input.scope, ...assignment },
            },
          },
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
          },
        });
        await this.audit.record(
          {
            action: 'workspace.file_uploaded',
            entityType: 'FileRecord',
            entityId: record.id,
            userId: user.id,
            ipAddress,
            metadata: { scope: input.scope, sizeBytes: stored.sizeBytes },
          },
          transaction,
        );
        return record;
      });
    } catch (error) {
      await this.storage.delete(stored.key);
      throw error;
    }
  }

  async download(user: AuthenticatedUser, id: string) {
    const record = await this.prisma.fileRecord.findFirst({
      where: {
        id,
        workspaceAttachments: { some: this.visibilityWhere(user) },
      },
      select: {
        originalName: true,
        storageKey: true,
        mimeType: true,
        sizeBytes: true,
      },
    });
    if (!record) throw new NotFoundException('File not found');
    return { ...record, path: await this.storage.pathFor(record.storageKey) };
  }

  private visibilityWhere(
    user: AuthenticatedUser,
  ): Prisma.WorkspaceAttachmentWhereInput {
    return {
      OR: [
        { scope: WorkspaceFileScope.COMPANY },
        ...(user.branch
          ? [{ scope: WorkspaceFileScope.BRANCH, branchId: user.branch.id }]
          : []),
        ...(user.department
          ? [
              {
                scope: WorkspaceFileScope.DEPARTMENT,
                departmentId: user.department.id,
              },
            ]
          : []),
      ],
    };
  }

  private scopeAssignment(scope: WorkspaceFileScope, user: AuthenticatedUser) {
    if (scope === WorkspaceFileScope.COMPANY) {
      if (user.branch) {
        throw new BadRequestException(
          'Company files require company-wide access',
        );
      }
      return {};
    }
    if (scope === WorkspaceFileScope.BRANCH) {
      if (!user.branch)
        throw new BadRequestException('A branch assignment is required');
      return { branchId: user.branch.id };
    }
    if (!user.department) {
      throw new BadRequestException('A department assignment is required');
    }
    return { branchId: user.branch?.id, departmentId: user.department.id };
  }

  private cleanFilename(value: string) {
    const base = value.replace(/\\/g, '/').split('/').pop() ?? '';
    const normalized = base.normalize('NFKC');
    const cleaned = Array.from(normalized)
      .map((character) => {
        const code = character.charCodeAt(0);
        return code < 32 || code === 127 || '<>:"/\\|?*'.includes(character)
          ? '_'
          : character;
      })
      .join('')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180);
    if (!cleaned || cleaned === '.' || cleaned === '..') {
      throw new BadRequestException('Filename is invalid');
    }
    return cleaned;
  }

  private detectType(buffer: Buffer, filename: string) {
    const extension = extname(filename).toLowerCase();
    const binary = binaryTypes.find(({ matches }) => matches(buffer));
    if (binary) {
      if (!binary.extensions.includes(extension)) {
        throw new BadRequestException(
          'File extension does not match its content',
        );
      }
      return binary.mime;
    }
    if (!['.txt', '.csv', '.md'].includes(extension)) {
      throw new BadRequestException(
        'Only PDF, PNG, JPEG, WebP, TXT, CSV, and Markdown files are allowed',
      );
    }
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      throw new BadRequestException('Text file is not valid UTF-8');
    }
    if (buffer.includes(0))
      throw new BadRequestException('Text file content is invalid');
    return extension === '.csv'
      ? 'text/csv'
      : extension === '.md'
        ? 'text/markdown'
        : 'text/plain';
  }
}
