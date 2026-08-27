import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { parse } from 'cookie';
import type { Server, Socket } from 'socket.io';
import type { AuthenticatedUser } from '../auth/auth-user';
import { ACCESS_COOKIE } from '../auth/auth.constants';
import { AuthTokenService } from '../auth/auth-token.service';
import { WorkspaceEventsService } from './workspace-events.service';

interface ClientEvents {
  'workspace:ping': () => void;
}
interface ServerEvents {
  'workspace:ready': (payload: { connectedAt: string }) => void;
}
interface SocketData {
  user?: AuthenticatedUser;
}
type AuthenticatedSocket = Socket<
  ClientEvents,
  ServerEvents,
  Record<never, never>,
  SocketData
>;

@WebSocketGateway({ namespace: '/workspace', path: '/api/v1/socket.io' })
export class WorkspaceGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly tokens: AuthTokenService,
    private readonly events: WorkspaceEventsService,
  ) {}

  afterInit(server: Server) {
    this.events.attach(server);
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = parse(client.handshake.headers.cookie ?? '')[ACCESS_COOKIE];
      if (!token) throw new Error('Missing access cookie');
      const user = await this.tokens.authenticate(token);
      if (!user.permissions.includes('workspace.access')) {
        throw new Error('Workspace access denied');
      }
      client.data.user = user;
      await client.join(`user:${user.id}`);
      client.emit('workspace:ready', { connectedAt: new Date().toISOString() });
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('workspace:ping')
  ping(@ConnectedSocket() client: AuthenticatedSocket) {
    return client.data.user
      ? { ok: true, at: new Date().toISOString() }
      : { ok: false };
  }
}
