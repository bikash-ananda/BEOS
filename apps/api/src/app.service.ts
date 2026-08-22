import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'beos-api',
      product: 'BEOS — Bikash Engineering Operating System',
    };
  }
}
