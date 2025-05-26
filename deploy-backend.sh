#!/bin/bash

cd /home/ubuntu/backend

# Obtener los últimos cambios
git pull origin main

# Entrar a src y reinstalar dependencias
cd src
npm install

# Reiniciar backend
pm2 restart all
