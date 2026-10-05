import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';
import { Status } from '../statuses/status.entity';
import { ApiKey } from '../api-keys/api-key.entity';
import { API_KEY_PREFIX, hashApiKey } from '../api-keys/api-keys.service';

// Manage bot users and API keys. Run on the server with the backend .env loaded:
//   node dist/scripts/api-keys.js bot <username> "<Full Name>"   create a bot user
//   node dist/scripts/api-keys.js create <username> <key name>    issue a key (shown once)
//   node dist/scripts/api-keys.js list
//   node dist/scripts/api-keys.js revoke <key id>

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'lilit_tasks',
  entities: [User, Task, Status, ApiKey],
  synchronize: false,
});

async function main(cmd: string | undefined, args: string[]) {
  const users = dataSource.getRepository(User);
  const keys = dataSource.getRepository(ApiKey);

  switch (cmd) {
    case 'bot': {
      const [username, fullName] = args;
      if (!username || !fullName) throw new Error('Usage: bot <username> "<Full Name>"');
      if (await users.findOne({ where: { username } })) {
        console.log(`user ${username} already exists`);
        return;
      }
      // Bots never log in with a password; they get a random one nobody knows.
      await users.save(
        users.create({
          username,
          fullName,
          role: 'user',
          available: true,
          permissions: ['see_other_tasks'],
          passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
        }),
      );
      console.log(`created bot user ${username} (${fullName})`);
      return;
    }
    case 'create': {
      const [username, name] = args;
      if (!username || !name) throw new Error('Usage: create <username> <key name>');
      const user = await users.findOne({ where: { username } });
      if (!user) throw new Error(`No user ${username}`);
      const key = API_KEY_PREFIX + randomBytes(24).toString('base64url');
      await keys.save(keys.create({ name, prefix: key.slice(0, 10), keyHash: hashApiKey(key), user }));
      console.log(`API key for ${username} (${name}). Shown once, store it now:\n${key}`);
      return;
    }
    case 'list': {
      for (const k of await keys.find({ order: { id: 'ASC' } })) {
        const state = k.revokedAt ? `revoked ${k.revokedAt.toISOString()}` : 'active';
        const used = k.lastUsedAt ? k.lastUsedAt.toISOString() : 'never';
        console.log(`${k.id}  ${k.prefix}…  ${k.name}  user=${k.user?.username}  last used ${used}  ${state}`);
      }
      return;
    }
    case 'revoke': {
      const id = Number(args[0]);
      if (!id) throw new Error('Usage: revoke <key id>');
      const res = await keys.update({ id }, { revokedAt: new Date() });
      console.log(res.affected ? `revoked key ${id}` : `no key ${id}`);
      return;
    }
    default:
      throw new Error('Commands: bot, create, list, revoke');
  }
}

dataSource
  .initialize()
  .then(() => main(process.argv[2], process.argv.slice(3)))
  .then(() => dataSource.destroy())
  .catch(async (err) => {
    console.error(err.message || err);
    if (dataSource.isInitialized) await dataSource.destroy();
    process.exit(1);
  });
