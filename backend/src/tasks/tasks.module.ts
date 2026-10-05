import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';
import { UsersModule } from '../users/users.module';
import { StatusesModule } from '../statuses/statuses.module';
import { User } from '../users/user.entity';
import { Status } from '../statuses/status.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User, Status]),
    UsersModule,
    StatusesModule
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
