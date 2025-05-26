#!/bin/bash
apt update -y
apt install -y git curl

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Clonar el repo y entrar
cd /home/ubuntu
git clone ${backend_repo_url} backend
cd backend/src
npm install

# Crear archivo .env con secretos
cat <<EOF > .env
DB_HOST=${rds_endpoint}
DB_NAME=${db_name}
DB_USER=${db_username}
DB_PASS=${db_password}
LOCATIONIQ_API_KEY=${locationiq_api_key}
EOF

# Ejecutar backend con PM2
npm install -g pm2
pm2 start npm -- start