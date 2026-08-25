import { Module } from '@nestjs/common';
import { AdministrationController } from './administration.controller';
import { OrganizationService } from './organization.service';
import { RolesService } from './roles.service';
import { UsersService } from './users.service';

@Module({
  controllers: [AdministrationController],
  providers: [OrganizationService, RolesService, UsersService],
})
export class AdministrationModule {}
