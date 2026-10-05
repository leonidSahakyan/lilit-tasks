import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { StatusesModule } from './statuses/statuses.module';
import { User } from './users/user.entity';
import { Task } from './tasks/task.entity';
import { Status } from './statuses/status.entity';
import { SocketModule } from './services/socket.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'task_scheduler',
      entities: [User, Task, Status],
      synchronize: false,
      retryAttempts: 10,
      retryDelay: 10000,
    }),

    UsersModule,
    TasksModule,
    AuthModule,
    StatusesModule,
    SocketModule,
  ],
})
export class AppModule {}
