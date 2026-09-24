import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { Environment } from '../config/environment';
import { FILE_STORAGE } from './file-storage';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { LocalFileStorageService } from './local-file-storage.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => ({
        limits: {
          fileSize: config.get('FILE_MAX_SIZE_BYTES', { infer: true }),
          files: 1,
        },
      }),
    }),
  ],
  controllers: [FilesController],
  providers: [
    FilesService,
    LocalFileStorageService,
    { provide: FILE_STORAGE, useExisting: LocalFileStorageService },
  ],
})
export class FilesModule {}
