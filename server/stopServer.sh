#!/bin/sh
docker compose --env-file .env -f ../node-services/alerting-service/docker-compose.yml down
docker compose down

