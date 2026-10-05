import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  private server!: Server;
  private onlineUsers = new Map<number, Set<string>>(); // userId -> set of socketIds

  setServer(server: Server) {
    this.server = server;
  }

  addUser(userId: number, socketId: string) {
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId)!.add(socketId);
  }

  removeUserBySocket(socketId: string) {
    for (const [userId, sockets] of this.onlineUsers.entries()) {
      if (sockets.has(socketId)) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
          this.onlineUsers.delete(userId);
        }
        break;
      }
    }
  }

  emitToUser(userId: number, event: string, data: any) {
    const sockets = this.onlineUsers.get(userId);
    if (sockets && this.server) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  emitToAll(event: string, data: any) {
    if (this.server) {
      this.server.emit(event, data);
    }
  }

  emitToAllExcept(excludedSocketId: string, event: string, data: any) {
    if (!this.server) return;

    this.onlineUsers.forEach((sockets) => {
      sockets.forEach((socketId) => {
        if (socketId !== excludedSocketId) {
          this.server.to(socketId).emit(event, data);
        }
      });
    });
  }
}
