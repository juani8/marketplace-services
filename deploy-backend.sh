#!/bin/bash

set -e

BACKEND_DIR="/home/ubuntu/backend"
REPO_URL="https://github.com/juani8/marketplace-services.git"

# Clona si no existe
if [ ! -d "$BACKEND_DIR" ]; then
  git clone "$REPO_URL" "$BACKEND_DIR"
fi

cd "$BACKEND_DIR"

git config --global --add safe.directory "$BACKEND_DIR"
git fetch origin main
git reset --hard origin/main

sudo chown -R ubuntu:ubuntu "$BACKEND_DIR"
sudo chmod -R u+rwX "$BACKEND_DIR"

cd src
npm install

# Crea .env si las variables están presentes
if [[ -n "$RDS_ENDPOINT" && -n "$DB_NAME" && -n "$DB_USERNAME" && -n "$DB_PASSWORD" && -n "$LOCATIONIQ_API_KEY" ]]; then
  cat <<EOF > .env
DB_HOST=${RDS_ENDPOINT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USERNAME}
DB_PASS=${DB_PASSWORD}
LOCATIONIQ_API_KEY=${LOCATIONIQ_API_KEY}
EOF
  echo ".env file created."
else
  echo "One or more environment variables for .env are missing. Skipping .env creation."
fi

if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
fi

# Parar y eliminar el proceso anterior (si existe)
pm2 stop backend || true
pm2 delete backend || true

# Ejecutar backend con PM2 (ajusta server.js si corresponde)
pm2 start app.js --name backend
pm2 save
