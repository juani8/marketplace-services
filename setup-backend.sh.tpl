#!/bin/bash
set -e

# Instalar dependencias básicas
apt update -y
apt install -y git curl

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Clonar el repo y entrar
cd /home/ubuntu

if [ ! -d "backend" ]; then
  git clone "${BACKEND_REPO_URL}" backend
fi

cd backend/src
npm install

# Crear archivo .env solo si las variables existen
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

# Instalar PM2 si no existe
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi

# Ejecutar backend con PM2
pm2 start npm -- start
