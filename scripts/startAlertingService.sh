if [[ "$1" == "docker" ]]; then
    docker compose --env-file .env -f ../node-services/alerting-service/docker-compose.yml up -d
else
    cd ../node-services/alerting-service
    if [ ! -d node_modules ]; then
        npm ci
    fi
    npm start
fi
