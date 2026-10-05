import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusesService } from './statuses.service';
import { StatusesController } from './statuses.controller';
import { Status } from './status.entity';
import { Task } from '../tasks/task.entity' 

@Module({
  imports: [
    TypeOrmModule.forFeature([Status, Task]),
  ],
  controllers: [StatusesController],
  providers: [StatusesService],
  exports: [StatusesService],
})
export class StatusesModule {}