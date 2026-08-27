import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConversationAccessService } from './conversation-access.service';
import { DiscussionsController } from './discussions.controller';
import { DiscussionsService } from './discussions.service';

@Module({
  imports: [AuthModule],
  controllers: [
    DiscussionsController,
    ConversationsController,
    AnnouncementsController,
  ],
  providers: [
    DiscussionsService,
    ConversationsService,
    ConversationAccessService,
    AnnouncementsService,
  ],
})
export class CommunicationModule {}
