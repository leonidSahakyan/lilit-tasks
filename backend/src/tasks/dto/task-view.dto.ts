
export class TaskView {
  id!: number;
  title!: string;
  description?: string | null;
  dueDate?: Date | null;
  assignedUserId?: number | null;
  statusId!: number;
  createdAt!: Date;
  updatedAt!: Date;
  position!: number;
  completed!: number;

  constructor(partial: Partial<TaskView>) {
    Object.assign(this, partial);
  }
}