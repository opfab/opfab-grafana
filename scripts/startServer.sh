#!/bin/bash

echo USER_ID="$(id -u)" > .env
echo USER_GID="$(id -g)" >> .env
docker compose --env-file .env -f ../server/docker-compose.yml up -d
./waitForOpfabToStart.sh
