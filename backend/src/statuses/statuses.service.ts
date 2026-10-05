import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from './status.entity';
import { Task } from '../tasks/task.entity';
import { SocketService } from '../services/socket.service';
import { getStatsOptimized } from '../tasks/task-stats.helper';

@Injectable()
export class StatusesService {
  constructor(
    @InjectRepository(Status)
    private readonly statusRepository: Repository<Status>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly socketService: SocketService,
  ) {}

  getAll(): Promise<Status[]> {
    return this.statusRepository.find({ order: { position: 'ASC' } });
  }

  async create(name: string, initiatorSocketId?: string): Promise<Status> {
    const lastStatus = await this.statusRepository.findOne({
      where: {},
      order: { position: 'DESC' },
    });

    const status = this.statusRepository.create({
      name,
      position: lastStatus ? lastStatus.position + 1 : 1,
    });

    const saved = await this.statusRepository.save(status);

    if (initiatorSocketId) {
      this.socketService.emitToAllExcept(
        initiatorSocketId,
        'column.created',
        saved,
      );
    } else {
      this.socketService.emitToAll('column.created', saved);
    }

    await this.emitStatsUpdate();
    return saved;
  }

  async updateOrder(order: number[], initiatorSocketId?: string) {
    for (let i = 0; i < order.length; i++) {
      await this.statusRepository.update(order[i], { position: i + 1 });
    }

    if (initiatorSocketId) {
      this.socketService.emitToAllExcept(
        initiatorSocketId,
        'columns.reordered',
        order,
      );
    } else {
      this.socketService.emitToAll('columns.reordered', order);
    }

    await this.emitStatsUpdate();
    return true;
  }

  async updateTitle(
    id: number,
    name: string,
    initiatorSocketId?: string,
  ): Promise<Status> {
    const status = await this.statusRepository.findOne({ where: { id } });
    if (!status) throw new NotFoundException('Status not found');

    status.name = name;
    const updated = await this.statusRepository.save(status);

    if (initiatorSocketId) {
      this.socketService.emitToAllExcept(
        initiatorSocketId,
        'column.updated',
        updated,
      );
    } else {
      this.socketService.emitToAll('column.updated', updated);
    }

    await this.emitStatsUpdate();
    return updated;
  }

  async remove(
    id: number,
    currentUserRole: 'user' | 'admin',
    initiatorSocketId?: string,
  ): Promise< {success: true} > {
    if (currentUserRole !== 'admin') {
      throw new ForbiddenException('Only admins can delete statuses');
    }
    const status = await this.statusRepository.findOne({ where: { id } });
    if (!status) throw new NotFoundException('Status not found');

    await this.taskRepository.delete({ status: { id } });
    await this.statusRepository.remove(status);

    this.socketService.emitToAll('column.deleted', { id });

    await this.emitStatsUpdate();

    return { success: true };
  }

  private async emitStatsUpdate() {
    const stats = await getStatsOptimized(
      this.taskRepository,
      this.statusRepository,
    );
    this.socketService.emitToAll('tasks.statsUpdated', stats);
  }
}
