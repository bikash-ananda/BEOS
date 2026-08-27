import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkspaceEventsService } from './workspace-events.service';
import { WorkspaceGateway } from './workspace.gateway';

@Global()
@Module({
  imports: [AuthModule],
  providers: [WorkspaceEventsService, WorkspaceGateway],
  exports: [WorkspaceEventsService],
})
export class WorkspaceLiveModule {}
