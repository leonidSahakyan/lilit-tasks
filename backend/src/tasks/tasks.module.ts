import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';
import { UsersModule } from '../users/users.module';
import { StatusesModule } from '../statuses/statuses.module';
import { User } from '../users/user.entity';
import { Status } from '../statuses/status.entity';
import { TaskComment } from '../activity/task-comment.entity';
import { TaskEvent } from '../activity/task-event.entity';
import { ActivityService } from '../activity/activity.service';
import { ActivityController } from '../activity/activity.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User, Status, TaskComment, TaskEvent]),
    UsersModule,
    StatusesModule
  ],
  controllers: [TasksController, ActivityController],
  providers: [TasksService, ActivityService],
  exports: [TasksService],
})
export class TasksModule {}
