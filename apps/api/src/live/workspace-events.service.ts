import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';

export interface WorkspaceEvent {
  resource:
    | 'discussion'
    | 'conversation'
    | 'message'
    | 'announcement'
    | 'meeting'
    | 'task';
  action: 'created' | 'updated' | 'deleted' | 'reacted' | 'read';
  id: string;
  conversationId?: string;
  meetingId?: string;
  taskId?: string;
}

@Injectable()
export class WorkspaceEventsService {
  private server?: Server;

  attach(server: Server) {
    this.server = server;
  }

  emitToUsers(userIds: Iterable<string>, event: WorkspaceEvent) {
    if (!this.server) return;
    for (const userId of new Set(userIds)) {
      this.server.to(`user:${userId}`).emit('workspace:changed', event);
    }
  }

  emitAll(event: WorkspaceEvent) {
    this.server?.emit('workspace:changed', event);
  }
}
