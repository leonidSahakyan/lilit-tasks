import { Global, Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [AuthModule],
  providers: [SocketService, SocketGateway],
  exports: [SocketService],
})
export class SocketModule {}