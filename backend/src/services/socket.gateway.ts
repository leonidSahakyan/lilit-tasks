import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { SocketService } from './socket.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private jwtService: JwtService,
    private socketService: SocketService,
  ) {}

  afterInit() {
    this.socketService.setServer(this.server);
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      this.socketService.addUser(userId, client.id);
    } catch (err) {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.socketService.removeUserBySocket(client.id);
  }
}
