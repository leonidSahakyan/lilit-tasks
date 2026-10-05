import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { Task } from './tasks/task.entity';
import { Status } from './statuses/status.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'task_scheduler',
  entities: [User, Task, Status],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});