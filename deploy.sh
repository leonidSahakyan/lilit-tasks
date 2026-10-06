#!/bin/sh
# Deploy Lilit Tasks (lilit.rebit.ai) to production, check it, and roll back if the check fails.
#
#   ./deploy.sh                       deploy the current checkout
#
# DEPLOY_SSH is the ssh host to use (default: lilit-prod, i.e. user lilit on the server).
# Works as user lilit or as root (then remote commands run as lilit).
# The frontend is built here because the server's Node is too old for Vite 7.
set -eu

cd "$(dirname "$0")"
HOST="${DEPLOY_SSH:-lilit-prod}"
BACKEND=/home/lilit/tasks/backend
WWW=/var/www/lilit-tasks
SITE=https://lilit.rebit.ai

remote_user=$(ssh "$HOST" whoami)
if [ "$remote_user" = root ]; then AS="sudo -u lilit -H"; else AS=""; fi

echo "== build"
(cd backend && npm install --silent --no-audit --no-fund && npm run build)
(cd frontend && npm install --silent --no-audit --no-fund && VITE_API_URL="$SITE" npm run build-only)

echo "== save the running version"
ssh "$HOST" "$AS rsync -a --delete $BACKEND/dist/ $BACKEND/dist.prev/ && $AS rsync -a --delete $WWW/ $BACKEND/www.prev/"

echo "== upload"
rsync -az --delete --chown=lilit:lilit \
  backend/package.json backend/package-lock.json backend/dist "$HOST:$BACKEND/"
rsync -az --delete --chown=lilit:lilit frontend/dist/ "$HOST:$WWW/"

echo "== install, migrate, restart"
ssh "$HOST" "cd $BACKEND && $AS npm install --omit=dev --no-audit --no-fund --silent && $AS bash -c 'set -a; . ./.env; set +a; npx typeorm migration:run -d dist/data-source.js >/dev/null' && $AS pm2 restart lilit-tasks >/dev/null"

check() {
  for i in 1 2 3 4 5 6; do
    sleep 3
    page=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$SITE/")
    api=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$SITE/api/statuses")
    # The page must load and the API must answer (401 without a key means it is up).
    if [ "$page" = 200 ] && [ "$api" = 401 ]; then return 0; fi
  done
  return 1
}

if check; then
  echo "== live: $SITE ok ($(git rev-parse --short HEAD))"
else
  echo "== check FAILED, rolling back"
  ssh "$HOST" "$AS rsync -a --delete $BACKEND/dist.prev/ $BACKEND/dist/ && $AS rsync -a --delete $BACKEND/www.prev/ $WWW/ && $AS pm2 restart lilit-tasks >/dev/null"
  if check; then echo "== rolled back, previous version is live"; else echo "== ROLLBACK ALSO FAILED: site is down"; fi
  echo "Note: database migrations are not rolled back automatically."
  exit 1
fi
