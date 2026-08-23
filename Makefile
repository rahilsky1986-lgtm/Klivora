# Klivora Makefile
# Usage: make <target>

.PHONY: help dev build up down logs clean test lint db-migrate db-seed

# Default target
help:
	@echo "Klivora - Accounting App"
	@echo ""
	@echo "Development:"
	@echo "  make dev          Start development environment"
	@echo "  make up           Start production environment"
	@echo "  make down         Stop all services"
	@echo "  make logs         View logs"
	@echo "  make clean        Remove containers, volumes, and images"
	@echo ""
	@echo "Backend:"
	@echo "  make backend-dev  Start backend in dev mode"
	@echo "  make backend-logs View backend logs"
	@echo "  make backend-test Run backend tests"
	@echo "  make backend-lint Lint backend code"
	@echo ""
	@echo "Frontend:"
	@echo "  make web-dev      Start frontend in dev mode"
	@echo "  make web-logs     View frontend logs"
	@echo "  make web-test     Run frontend tests"
	@echo "  make web-lint     Lint frontend code"
	@echo "  make web-build    Build frontend for production"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate   Run database migrations"
	@echo "  make db-seed      Seed database with sample data"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build Build all Docker images"
	@echo "  make docker-push  Push images to registry"
	@echo ""
	@echo "Utilities:"
	@echo "  make cron-recurring  Run recurring invoices processor"
	@echo "  make cron-overdue    Run overdue invoices checker"

# Development environment
dev:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Production environment
up:
	docker-compose up -d

# Stop services
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Clean everything
clean:
	docker-compose down -v --rmi all --remove-orphans

# Backend commands
backend-dev:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d backend

backend-logs:
	docker-compose logs -f backend

backend-test:
	docker-compose exec backend npm test

backend-lint:
	docker-compose exec backend npm run lint

# Frontend commands
web-dev:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d web

web-logs:
	docker-compose logs -f web

web-test:
	docker-compose exec web npm test

web-lint:
	docker-compose exec web npm run lint

web-build:
	docker-compose exec web npm run build

# Database (requires local DB or Supabase)
db-migrate:
	@echo "Run migrations in Supabase SQL Editor using database/schema.sql"

db-seed:
	@echo "Seed data not implemented yet"

# Docker build and push
docker-build:
	docker-compose build

docker-push:
	docker-compose push

# Cron jobs
cron-recurring:
	docker-compose exec cron node scripts/process-recurring-invoices.js

cron-overdue:
	docker-compose exec cron node scripts/check-overdue-invoices.js

# Install dependencies locally (without Docker)
install:
	cd backend && npm ci
	cd web && npm ci

# Format code
format:
	cd backend && npx prettier --write .
	cd web && npx prettier --write .