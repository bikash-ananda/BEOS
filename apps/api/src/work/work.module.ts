import { Module } from '@nestjs/common';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { WorkAccessService } from './work-access.service';

@Module({
  controllers: [MeetingsController, TasksController],
  providers: [MeetingsService, TasksService, WorkAccessService],
})
export class WorkModule {}
