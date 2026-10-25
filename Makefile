# compose.yaml の user: "${HOST_UID}:${HOST_GID}" に現在のユーザーの UID/GID を渡す
export HOST_UID := $(shell id -u)
export HOST_GID := $(shell id -g)

.PHONY: up b cl cx stop down build

up:
	docker compose up

b:
	docker compose exec ai bash

cl:
	docker compose exec ai claude

cx:
	docker compose exec ai codex

stop:
	docker compose stop

down:
	docker compose down

build:
	docker compose build
