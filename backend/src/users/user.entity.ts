import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Task } from '../tasks/task.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  fullName!: string;

  @Column()
  role!: 'admin' | 'user';

  @Column({ default: true })
  available!: boolean;

  @Column()
  passwordHash!: string;

  @OneToMany(() => Task, (task) => task.assignedUser)
  tasks!: Task[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'datetime', nullable: true, default: null })
  lastSeen?: Date;

  @Column({ type: 'simple-array', nullable: true, default: null })
  permissions?: string[];
}

export class UserDto {
  id: number;
  username: string;
  fullName: string;
  available: boolean;
  role: 'admin' | 'user';
  updatedAt: Date;
  lastSeen?: Date | null;
  permissions?: string[]  | null;

  constructor(u: any) {
    this.id = u.id;
    this.username = u.username;
    this.fullName = u.fullName;
    this.available = u.available;
    this.role = u.role;
    this.updatedAt = u.updatedAt;
    this.lastSeen = u.lastSeen;

    if (u.role === 'user') {
      this.permissions = u.permissions;
    }
  }
}
