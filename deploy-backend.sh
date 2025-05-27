#!/bin/bash

set -e

# Datos del backend
BACKEND_DIR="/home/ubuntu/backend"
REPO_URL="https://github.com/juani8/marketplace-services.git"

# Si no existe la carpeta, clónala
if [ ! -d "$BACKEND_DIR" ]; then
  git clone "$REPO_URL" "$BACKEND_DIR"
fi

cd "$BACKEND_DIR"

# Si no es un repo git:
if [ ! -d ".git" ]; then
  echo "No .git directory found! Exiting."
  exit 1
fi

git config --global --add safe.directory "$BACKEND_DIR"
git pull origin main

cd src

# Permisos correctos
sudo chown -R ubuntu:ubuntu "$BACKEND_DIR"
sudo chmod -R u+rwX "$BACKEND_DIR"

npm install

# Si pm2 no existe:
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
fi

pm2 restart all || pm2 start npm -- start
