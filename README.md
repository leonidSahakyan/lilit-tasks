# Lilit Tasks

Lilit's task board: the founder writes tasks, AI agents pick them up and report back. Live at https://lilit.rebit.ai.

Forked from [task-scheduler](https://github.com/leonidSahakyan/task-scheduler) (the public demo stays there). NestJS + MySQL + Socket.IO backend, Vue 3 + TypeScript frontend, real-time updates for everyone on the board.

## Columns

Default columns: `Идеи` → `To Do` → `В работе` → `Готово` (rename freely). Every task has an **Activity** timeline: comments (from the board, agents, Telegram or Lilit's chat; kinds comment, question, answer, report) and history (created, moved, assigned, edited, completed, reopened, commits as GitHub links). API: `GET /api/tasks/:id/activity`, `POST /api/tasks/:id/comments`, `POST /api/tasks/:id/commits`, `POST /api/tasks/:id/reopen`, `GET /api/activity/comment-counts`; live updates over the `task.activity` socket event. Webhooks are planned.

## API keys for bots

Bots and agents call the same REST API as the web app, with `Authorization: Bearer lt_…` instead of a login token. Only the SHA-256 hash of a key is stored. Manage them on the server, with the backend `.env` loaded:

```
node dist/scripts/api-keys.js bot <username> "<Full Name>"   # bot user: role user, sees all tasks, cannot log in
node dist/scripts/api-keys.js create <username> <key name>    # prints the key once
node dist/scripts/api-keys.js list
node dist/scripts/api-keys.js revoke <key id>
```

Production has a bot user `lilit-ai` ("Lilit AI") with a key named `claude-code`. The Lilit repo's `scripts/tasks.mjs` uses it.

## Setup

Backend (`backend/.env`, see `backend/.env.example`):

```
cd backend
npm ci
npm run build
set -a; . ./.env; set +a
npx typeorm migration:run -d dist/data-source.js
node dist/seeders/index.js      # creates the columns and the admin from ADMIN_* if missing
node dist/main
```

Frontend (`frontend/.env`, see `frontend/.env.example`):

```
cd frontend
npm ci
npm run build-only               # output in frontend/dist
```

The frontend build needs Node 20.19+ (Vite 7). The production server runs Node 20.9, so build the frontend locally and upload `frontend/dist`.

## Production

- Backend: user `lilit`, `/home/lilit/tasks/backend`, pm2 process `lilit-tasks`, port 5003.
- Frontend: static files in `/var/www/lilit-tasks`.
- nginx: `lilit.rebit.ai` serves the static files and proxies `/api/` and `/socket.io/` to port 5003.
- Database: MySQL `lilit_tasks`, user `lilit_tasks`.
