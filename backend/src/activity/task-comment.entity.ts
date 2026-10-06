import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Task } from '../tasks/task.entity';
import { User } from '../users/user.entity';

// A comment on a task: from the board, an agent, Telegram or Lilit's chat.
@Entity('task_comment')
export class TaskComment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  task!: Task;

  @ManyToOne(() => User, { nullable: true, eager: true, onDelete: 'SET NULL' })
  author?: User | null;

  // comment | question | answer | report
  @Column({ length: 16, default: 'comment' })
  kind!: string;

  // board | agent | telegram | chat
  @Column({ length: 16, default: 'board' })
  source!: string;

  @Column({ type: 'text' })
  body!: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
