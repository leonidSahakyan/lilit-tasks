import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTasksPositionDto,
  FindTasksDto,
  TaskView,
} from './dto';
import { Task } from './task.entity';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('stats')
  async getStats() {
    return this.tasksService.getStatsOptimized();
  }

  @Get()
  async findAll(
    @Query() query: FindTasksDto,
    @CurrentUser() user: { userId: number; role: 'admin' | 'user' },
  ): Promise<TaskView[]> {
    return this.tasksService.findAll(query, user.userId, user.role);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Task> {
    return this.tasksService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTaskDto): Promise<TaskView> {
    return this.tasksService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ): Promise<{ success: boolean }> {
    try {
      await this.tasksService.update(id, dto);
      return { success: true };
    } catch (err) {
      console.error('Task update failed:', err);
      return { success: false };
    }
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number; role: 'admin' | 'user' },
  ): Promise<{ success: true }> {
    return this.tasksService.remove(id, user.userId, user.role);
  }

  @Patch('bulk-update-positions')
  async bulkUpdate(@Body() dto: UpdateTasksPositionDto) {
    return this.tasksService.updateTasksPositionsBulk(dto);
  }

  @Patch(':id/completed')
  async updateCompleted(
    @Param('id') id: number,
    @Body('completed') completed: number,
    @Body('initiatorSocketId') initiatorSocketId: string,
    @CurrentUser() user: { userId: number; role: string },
  ) {
    return this.tasksService.updateCompleted(
      id,
      completed,
      user.userId,
      initiatorSocketId,
    );
  }
}
