#!/bin/bash

echo USER_ID="$(id -u)" > .env
echo USER_GID="$(id -g)" >> .env
if [[ "$1" == "alerting" ]]; then
    docker compose --env-file .env -f ../node-services/alerting-service/docker-compose.yml up -d
fi
docker compose up -d
./waitForOpfabToStart.sh
