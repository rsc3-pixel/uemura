# Makefile para automatizar as tarefas do e-commerce Uemura (React + Node.js + SQLite)

.PHONY: help install dev dev-frontend dev-backend build db-push clean

# Comando padrao exibe instrucoes de uso
help:
	@echo "Uemura Flores e Plantas - Comandos de Automação:"
	@echo "  make install   - Instala as dependencias do front-end e do backend"
	@echo "  make dev       - Inicia o front-end e o backend em paralelo para desenvolvimento"
	@echo "  make build     - Compila ambas as aplicacoes para producao"
	@echo "  make db-push   - Sincroniza o schema do Prisma com o banco de dados SQLite local"
	@echo "  make clean     - Limpa os modulos de dependencias e pastas de build"

# Instalar dependencias em ambos os ambientes
install:
	@echo "Instalando dependencias do front-end (Vite/React)..."
	npm install
	@echo "Instalando dependencias do backend (Node/Express)..."
	cd backend && npm install

# Sincronizar o banco de dados SQLite local
db-push:
	@echo "Sincronizando tabelas do Prisma com o SQLite local..."
	cd backend && npx prisma db push

# Iniciar ambos os servidores de desenvolvimento em paralelo (utiliza jobs paralelos do Make)
dev:
	@echo "Iniciando front-end e backend em paralelo..."
	$(MAKE) -j 2 dev-frontend dev-backend

dev-frontend:
	npm run dev

dev-backend:
	cd backend && npm run dev

# Compilar projetos para producao (valida tipos TypeScript)
build:
	@echo "Compilando front-end para producao..."
	npm run build
	@echo "Compilando backend para producao..."
	cd backend && npm run build

# Remover node_modules e pastas de build para reiniciar do zero
clean:
	@echo "Removendo pastas temporarias, dist e node_modules..."
	rm -rf node_modules dist
	rm -rf backend/node_modules backend/dist backend/prisma/dev.db
