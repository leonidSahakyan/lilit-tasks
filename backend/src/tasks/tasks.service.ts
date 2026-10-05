import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Task } from './task.entity';
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTasksPositionDto,
  FindTasksDto,
  TaskView,
  mapTaskToView,
} from './dto';
import { User } from '../users/user.entity';
import { Status } from '../statuses/status.entity';
import { SocketService } from '../services/socket.service';
import { addDays, startOfDay, endOfDay, subDays } from 'date-fns';
import { getStatsOptimized } from './task-stats.helper';
import { checkPermission } from '../users/user.helper';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private taskRepo: Repository<Task>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Status) private statusRepo: Repository<Status>,
    private readonly socketService: SocketService,
  ) {}

  async findOne(id: number): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['assignedUser'],
      select: {
        id: true,
        title: true,
        description: true,
        assignedUser: {
          id: true,
          fullName: true,
        },
      },
    });

    if (!task) throw new NotFoundException(`Task with id ${id} not found`);
    return task;
  }

  async findAll(
    filters: FindTasksDto,
    currentUserId: number,
    currentUserRole: 'user' | 'admin',
  ): Promise<TaskView[]> {
    const canSeeOtherTasks =
      currentUserRole === 'admin'
        ? true
        : await checkPermission(
            { userId: currentUserId, role: currentUserRole },
            'see_other_tasks',
            this.userRepo,
          );

    const qb = this.taskRepo
      .createQueryBuilder('task')
      .leftJoin('task.assignedUser', 'user')
      .leftJoin('task.status', 'status')
      .select([
        'task.id',
        'task.title',
        'task.description',
        'task.dueDate',
        'task.position',
        'task.createdAt',
        'task.updatedAt',
        'task.completed',
        'user.id',
        'status.id',
      ]);

    if (!canSeeOtherTasks) {
      qb.andWhere('task.assignedUserId = :currentUserId', { currentUserId });
    }

    if (filters.assignedUserIds?.length && canSeeOtherTasks) {
      const hasNoMembers = filters.assignedUserIds.includes(0);
      const hasAssignedToMe = filters.assignedUserIds.includes(-1);
      const userIds = filters.assignedUserIds.filter((id) => id > 0);

      qb.andWhere(
        new Brackets((qbInner) => {
          if (hasNoMembers) qbInner.orWhere('task.assignedUserId IS NULL');
          if (hasAssignedToMe)
            qbInner.orWhere('task.assignedUserId = :currentUserId', {
              currentUserId,
            });
          if (userIds.length)
            qbInner.orWhere('task.assignedUserId IN (:...userIds)', {
              userIds,
            });
        }),
      );
    }

    if (filters.status) {
      qb.andWhere('task.statusId = :status', { status: filters.status });
    }

    if (filters.completed !== undefined) {
      qb.andWhere('task.completed = :completed', {
        completed: filters.completed ? 1 : 0,
      });
    }

    if (filters.startDate)
      qb.andWhere('DATE(task.dueDate) >= :startDate', {
        startDate: filters.startDate,
      });
    if (filters.endDate)
      qb.andWhere('DATE(task.dueDate) <= :endDate', {
        endDate: filters.endDate,
      });

    if (filters.dueDate) {
      const now = new Date();
      if (filters.dueDate === 'none') qb.andWhere('task.dueDate IS NULL');
      else if (filters.dueDate === 'overdue')
        qb.andWhere('task.dueDate < :today', { today: now });
      else if (filters.dueDate === 'nextDay')
        qb.andWhere('task.dueDate BETWEEN :today AND :tomorrow', {
          today: startOfDay(now),
          tomorrow: endOfDay(addDays(now, 1)),
        });
      else if (filters.dueDate === 'nextWeek')
        qb.andWhere('task.dueDate BETWEEN :today AND :nextWeek', {
          today: startOfDay(now),
          nextWeek: endOfDay(addDays(now, 7)),
        });
      else if (filters.dueDate === 'nextMonth')
        qb.andWhere('task.dueDate BETWEEN :today AND :nextMonth', {
          today: startOfDay(now),
          nextMonth: endOfDay(addDays(now, 30)),
        });
    }

    if (filters.activity) {
      const now = new Date();
      if (filters.activity === 'lastWeek')
        qb.andWhere('task.updatedAt >= :since', { since: subDays(now, 7) });
      else if (filters.activity === 'lastTwoWeeks')
        qb.andWhere('task.updatedAt >= :since', { since: subDays(now, 14) });
      else if (filters.activity === 'lastFourWeeks')
        qb.andWhere('task.updatedAt >= :since', { since: subDays(now, 28) });
      else if (filters.activity === 'noActivity')
        qb.andWhere('task.updatedAt < :since OR task.updatedAt IS NULL', {
          since: subDays(now, 28),
        });
    }

    if (filters.keyword) {
      qb.andWhere('(task.title LIKE :kw OR task.description LIKE :kw)', {
        kw: `%${filters.keyword}%`,
      });
    }

    qb.orderBy('task.statusId', 'ASC').addOrderBy('task.position', 'ASC');

    const rawTasks = await qb.getRawMany();
    return rawTasks.map(
      (r) =>
        new TaskView({
          id: r.task_id,
          title: r.task_title,
          description: r.task_description,
          dueDate: r.task_dueDate ? new Date(r.task_dueDate) : null,
          position: r.task_position,
          createdAt: r.task_createdAt,
          updatedAt: r.task_updatedAt,
          assignedUserId: r.user_id ?? null,
          statusId: r.status_id,
          completed: r.task_completed,
        }),
    );
  }

  async create(dto: CreateTaskDto): Promise<TaskView> {
    let user: User | null = null;
    if (dto.assignedUserId) {
      user = await this.userRepo.findOne({ where: { id: dto.assignedUserId } });
      if (!user) throw new NotFoundException('Assigned user not found');
    }

    // Status is required
    const status = await this.statusRepo.findOne({
      where: { id: dto.statusId },
    });
    if (!status) throw new NotFoundException('Status not found');

    // Find max position in this status
    const maxPosTask = await this.taskRepo
      .createQueryBuilder('task')
      .select('MAX(task.position)', 'max')
      .where('task.statusId = :statusId', { statusId: status.id })
      .getRawOne<{ max: number }>();

    const nextPosition = (maxPosTask?.max ?? 0) + 1;

    const task = this.taskRepo.create({
      title: dto.title,
      description: dto.description,
      dueDate: dto.dueDate,
      assignedUser: user,
      status: status,
      position: nextPosition,
    });

    const saved = await this.taskRepo.save(task);

    const taskView = mapTaskToView(saved);

    if (dto.initiatorSocketId) {
      this.socketService.emitToAllExcept(
        dto.initiatorSocketId,
        'task.created',
        taskView,
      );
    } else {
      this.socketService.emitToAll('task.created', taskView);
    }

    this.emitStatsUpdate();
    return taskView;
  }

  async update(id: number, dto: UpdateTaskDto): Promise<TaskView> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['assignedUser', 'status'],
    });

    if (!task) throw new NotFoundException('Task not found');

    const oldAssignedUserId = task.assignedUser?.id;
    const oldUserFullName = task.assignedUser?.fullName || null;

    task.title = dto.title ?? task.title;
    task.description = dto.description ?? task.description;
    task.dueDate = dto.dueDate ?? task.dueDate;
    task.position = dto.position ?? task.position;

    if (dto.statusId !== undefined) {
      const status = await this.statusRepo.findOne({
        where: { id: dto.statusId },
      });
      if (!status) throw new NotFoundException('Status not found');
      task.status = status;
    }

    let newAssignedUserId: number | null = oldAssignedUserId ?? null;
    let newUserFullName: string | null = oldUserFullName;

    if (dto.assignedUserId !== undefined) {
      if (dto.assignedUserId === null) {
        task.assignedUser = null;
        newAssignedUserId = null;
        newUserFullName = null;
      } else {
        const user = await this.userRepo.findOne({
          where: { id: dto.assignedUserId },
        });
        if (!user) throw new NotFoundException('Assigned user not found');
        task.assignedUser = user;
        newAssignedUserId = user.id;
        newUserFullName = user.fullName;
      }
    }

    const saved = await this.taskRepo.save(task);
    const taskView = mapTaskToView(saved);

    if (dto.assignedUserId !== undefined) {
      if (oldAssignedUserId && oldAssignedUserId !== newAssignedUserId) {
        this.socketService.emitToUser(oldAssignedUserId, 'task.unassigned', {
          task: taskView,
          userFullName: oldUserFullName,
        });
      }
      if (newAssignedUserId && newAssignedUserId !== oldAssignedUserId) {
        this.socketService.emitToUser(newAssignedUserId, 'task.assigned', {
          task: taskView,
          userFullName: newUserFullName || 'Unknown',
        });
      }
    }

    if (dto.initiatorSocketId) {
      this.socketService.emitToAllExcept(
        dto.initiatorSocketId,
        'task.updated',
        taskView,
      );
    } else {
      this.socketService.emitToAll('task.updated', taskView);
    }

    this.emitStatsUpdate();

    return taskView;
  }

  async updateTasksPositionsBulk(
    dto: UpdateTasksPositionDto,
  ): Promise<TaskView[]> {
    const updates = dto.tasks;
    const initiatorSocketId = dto.initiatorSocketId;

    const updatedTasks: Task[] = [];

    for (const u of updates) {
      const task = await this.findOne(u.id);

      if (u.statusId !== undefined) {
        const status = await this.statusRepo.findOne({
          where: { id: u.statusId },
        });
        if (!status) throw new NotFoundException('Status not found');
        task.status = status;
      }

      task.position = u.position;
      const saved = await this.taskRepo.save(task);
      updatedTasks.push(saved);
    }

    const updatedViews = updatedTasks.map(mapTaskToView);

    if (initiatorSocketId) {
      this.socketService.emitToAllExcept(
        initiatorSocketId,
        'tasks.reordered',
        updatedViews,
      );
    } else {
      this.socketService.emitToAll('tasks.reordered', updatedViews);
    }

    this.emitStatsUpdate();

    return updatedViews;
  }

  async updateCompleted(
    id: number,
    completed: number,
    currentUserId: number,
    initiatorSocketId?: string,
  ): Promise<TaskView> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['assignedUser', 'status'],
    });
    if (!task) throw new NotFoundException('Task not found');

    task.completed = completed;
    const saved = await this.taskRepo.save(task);
    const taskView = mapTaskToView(saved);

    if (initiatorSocketId) {
      this.socketService.emitToAllExcept(
        initiatorSocketId,
        'task.updated',
        taskView,
      );
    } else {
      this.socketService.emitToAll('task.updated', taskView);
    }

    const assignedUserFullName = task.assignedUser?.fullName || 'Unknown';
    const eventName = completed ? 'task.completed' : 'task.uncompleted';
    const payload = {
      task: taskView,
      userFullName: assignedUserFullName,
    };

    const admins = await this.userRepo.find({
      where: { role: 'admin' },
      select: ['id'],
    });
    for (const admin of admins) {
      if (admin.id !== currentUserId) {
        this.socketService.emitToUser(admin.id, eventName, payload);
      }
    }

    if (task.assignedUser && task.assignedUser.id !== currentUserId) {
      this.socketService.emitToUser(task.assignedUser.id, eventName, payload);
    }

    this.emitStatsUpdate();
    return taskView;
  }

  async remove(
    id: number,
    currentUserId: number,
    currentUserRole: 'user' | 'admin',
  ): Promise<{success: true }> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['assignedUser'],
    });

    if (!task) throw new NotFoundException('Task not found');

    if (currentUserRole !== 'admin') {
      const canSeeOtherTasks = await checkPermission(
        { userId: currentUserId, role: currentUserRole },
        'see_other_tasks',
        this.userRepo,
      );

      if (!canSeeOtherTasks && task.assignedUser?.id !== currentUserId) {
        throw new ForbiddenException('You are not allowed to delete this task');
      }
    }

    const assignedUserId = task.assignedUser?.id;
    const assignedUserFullName = task.assignedUser?.fullName || 'Unknown';

    await this.taskRepo.remove(task);

    if (assignedUserId) {
      this.socketService.emitToUser(assignedUserId, 'task.removed', {
        taskTitle: task.title,
        userFullName: assignedUserFullName,
      });
    }

    this.socketService.emitToAll('task.deleted', { id });
    this.emitStatsUpdate();
    return { success: true };
  }

  async getStatsOptimized() {
    return getStatsOptimized(this.taskRepo, this.statusRepo);
  }

  private async emitStatsUpdate() {
    const stats = await getStatsOptimized(this.taskRepo, this.statusRepo);
    this.socketService.emitToAll('tasks.statsUpdated', stats);
  }
}
