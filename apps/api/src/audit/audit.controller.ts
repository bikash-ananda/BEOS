import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { PERMISSION_KEYS } from '../rbac/permissions';
import { AuditService } from './audit.service';

@Controller('audit')
@RequirePermissions(PERMISSION_KEYS.auditRead)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query() query: ListQueryDto) {
    return this.audit.list(query);
  }
}
