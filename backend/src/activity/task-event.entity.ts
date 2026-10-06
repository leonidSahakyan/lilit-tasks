import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Task } from '../tasks/task.entity';
import { User } from '../users/user.entity';

// Task history: created, moved, assigned, edited, completed, reopened, commit.
@Entity('task_event')
export class TaskEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  task!: Task;

  @ManyToOne(() => User, { nullable: true, eager: true, onDelete: 'SET NULL' })
  actor?: User | null;

  @Column({ length: 32 })
  type!: string;

  // Names are copied in, so history reads correctly even after renames.
  @Column({ type: 'simple-json', nullable: true })
  data?: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
