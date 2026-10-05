import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { User } from '../users/user.entity'
import { Status } from '../statuses/status.entity'

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  title!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'datetime', nullable: true })
  dueDate?: Date | null

  @ManyToOne(() => User, { nullable: true })
  assignedUser?: User | null

  @ManyToOne(() => Status, { eager: true })
  status!: Status

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date

  @Column({ type: 'int', default: 1 })
  position!: number
  
  @Column({ type: 'tinyint', default: 0 })
  completed!: number
}
