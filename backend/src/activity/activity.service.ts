import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskComment } from './task-comment.entity';
import { TaskEvent } from './task-event.entity';
import { Task } from '../tasks/task.entity';
import { User } from '../users/user.entity';
import { SocketService } from '../services/socket.service';

export type ActivityItem =
  | { kind: 'comment'; id: number; createdAt: Date; author: string | null; authorId: number | null; commentKind: string; source: string; body: string }
  | { kind: 'event'; id: number; createdAt: Date; actor: string | null; actorId: number | null; type: string; data: Record<string, unknown> | null };

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(TaskComment) private readonly comments: Repository<TaskComment>,
    @InjectRepository(TaskEvent) private readonly events: Repository<TaskEvent>,
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly socketService: SocketService,
  ) {}

  private async userOrNull(id?: number | null) {
    return id ? await this.users.findOne({ where: { id } }) : null;
  }

  private toComment(c: TaskComment): ActivityItem {
    return {
      kind: 'comment',
      id: c.id,
      createdAt: c.createdAt,
      author: c.author?.fullName ?? null,
      authorId: c.author?.id ?? null,
      commentKind: c.kind,
      source: c.source,
      body: c.body,
    };
  }

  private toEvent(e: TaskEvent): ActivityItem {
    return {
      kind: 'event',
      id: e.id,
      createdAt: e.createdAt,
      actor: e.actor?.fullName ?? null,
      actorId: e.actor?.id ?? null,
      type: e.type,
      data: e.data ?? null,
    };
  }

  async log(taskId: number, actorId: number | null | undefined, type: string, data?: Record<string, unknown>) {
    const saved = await this.events.save(
      this.events.create({ task: { id: taskId } as Task, actor: await this.userOrNull(actorId), type, data: data ?? null }),
    );
    this.socketService.emitToAll('task.activity', { taskId, item: this.toEvent(saved) });
    return saved;
  }

  async addComment(taskId: number, authorId: number | null, body: string, kind = 'comment', source = 'board') {
    if (!(await this.tasks.exist({ where: { id: taskId } }))) throw new NotFoundException('Task not found');
    const saved = await this.comments.save(
      this.comments.create({ task: { id: taskId } as Task, author: await this.userOrNull(authorId), body, kind, source }),
    );
    const item = this.toComment(saved);
    this.socketService.emitToAll('task.activity', { taskId, item });
    return item;
  }

  // Comments and history in one timeline, oldest first.
  async timeline(taskId: number): Promise<ActivityItem[]> {
    const [comments, events] = await Promise.all([
      this.comments.find({ where: { task: { id: taskId } }, order: { id: 'ASC' } }),
      this.events.find({ where: { task: { id: taskId } }, order: { id: 'ASC' } }),
    ]);
    return [...comments.map((c) => this.toComment(c)), ...events.map((e) => this.toEvent(e))].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  async commentCounts(): Promise<Record<number, number>> {
    const rows = await this.comments
      .createQueryBuilder('c')
      .select('c.taskId', 'taskId')
      .addSelect('COUNT(*)', 'n')
      .groupBy('c.taskId')
      .getRawMany<{ taskId: number; n: string }>();
    return Object.fromEntries(rows.map((r) => [r.taskId, Number(r.n)]));
  }
}
