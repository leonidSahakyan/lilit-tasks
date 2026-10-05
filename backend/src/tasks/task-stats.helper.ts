import { Task } from './task.entity';
import { Status } from '../statuses/status.entity';
import { Repository } from 'typeorm';

export async function getStatsOptimized(
  taskRepo: Repository<Task>,
  statusRepo: Repository<Status>,
) {
  const allStatuses = await statusRepo.find();
  const tasks = await taskRepo.find({
    select: ['id', 'updatedAt', 'completed', 'dueDate'],
    relations: ['status'],
  });

  const total = tasks.length;
  const now = new Date();

  let totalCompleted = 0;
  let totalOverdue = 0;

  const statusMap = new Map<number, { id: number; name: string; count: number }>();
  allStatuses.forEach((s) => {
    statusMap.set(s.id, { id: s.id, name: s.name, count: 0 });
  });

  tasks.forEach((task) => {
    const s = task.status;
    const statusData = statusMap.get(s.id)!;
    statusData.count++;

    if (task.completed) totalCompleted++;
    if (task.dueDate && !task.completed && new Date(task.dueDate) < now) totalOverdue++;
  });

  const statuses = Array.from(statusMap.values());

  const lastUpdatedTask = tasks.reduce((latest, task) => {
    return new Date(task.updatedAt) > new Date(latest.updatedAt) ? task : latest;
  }, tasks[0]);

  return {
    total,
    statuses,
    lastUpdated: lastUpdatedTask ? lastUpdatedTask.updatedAt : null,
    totalCompleted,
    totalOverdue,
  };
}