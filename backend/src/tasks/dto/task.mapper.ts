import { Task } from '../task.entity';
import { TaskView } from './';

export function mapTaskToView(task: Task): TaskView {
  return new TaskView({
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    dueDate: task.dueDate ?? null,
    assignedUserId: task.assignedUser?.id ?? null,
    statusId: task.status.id,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    position: task.position,
    completed: task.completed,
  });
}
// export function mapTasksToView(tasks: Task[]): TaskView[] {
//   return tasks.map(mapTaskToView)
// }