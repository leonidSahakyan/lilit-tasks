# Lilit Tasks

Lilit's task board: the founder writes tasks, AI agents pick them up and report back. Live at https://lilit.rebit.ai.

Forked from [task-scheduler](https://github.com/leonidSahakyan/task-scheduler) (the public demo stays there). NestJS + MySQL + Socket.IO backend, Vue 3 + TypeScript frontend, real-time updates for everyone on the board.

## Columns

`Идеи` → `To Do` → `В работе` → `Готово`. For now agents write their progress and results into the task description. Comments, API keys for agents and webhooks are planned.

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
