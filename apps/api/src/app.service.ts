import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return {
      status: 'ok',
      service: 'beos-api',
      product: 'BEOS — Bikash Engineering Operating System',
    };
  }

  async getReadiness() {
    await this.prisma.isReady();

    return {
      status: 'ready',
      service: 'beos-api',
      database: 'connected',
    };
  }
}
