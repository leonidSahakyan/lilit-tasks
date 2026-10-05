import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { Task } from '../tasks/task.entity'

@Entity()
export class Status {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @Column()
  position!: number

  @OneToMany(() => Task, (task) => task.status)
  tasks!: Task[]
}
