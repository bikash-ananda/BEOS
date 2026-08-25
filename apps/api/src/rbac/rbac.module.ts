import { Global, Module } from '@nestjs/common';
import { IdentitySeedService } from './identity-seed.service';

@Global()
@Module({ providers: [IdentitySeedService], exports: [IdentitySeedService] })
export class RbacModule {}
