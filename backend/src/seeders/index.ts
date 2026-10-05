import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';
import { Status } from '../statuses/status.entity';

// Lilit's board: the standard columns and a single admin from the environment.
// Safe to run more than once: it only creates what is missing.

const COLUMNS = ['Идеи', 'To Do', 'В работе', 'Готово'];

async function seedStatuses(dataSource: DataSource) {
  const repo = dataSource.getRepository(Status);
  if ((await repo.count()) > 0) return;
  await repo.save(COLUMNS.map((name, i) => repo.create({ name, position: i + 1 })));
  console.log(`created columns: ${COLUMNS.join(', ')}`);
}

async function seedAdmin(dataSource: DataSource) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD');

  const repo = dataSource.getRepository(User);
  if (await repo.findOne({ where: { username } })) return;
  await repo.save(
    repo.create({
      username,
      fullName: process.env.ADMIN_FULL_NAME || username,
      role: 'admin',
      available: true,
      passwordHash: await bcrypt.hash(password, 10),
    }),
  );
  console.log(`created admin ${username}`);
}

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'lilit_tasks',
  entities: [User, Task, Status],
  synchronize: false,
});

dataSource
  .initialize()
  .then(async () => {
    await seedStatuses(dataSource);
    await seedAdmin(dataSource);
    await dataSource.destroy();
  })
  .catch((err) => {
    console.error('Error seeding data:', err);
    process.exit(1);
  });
