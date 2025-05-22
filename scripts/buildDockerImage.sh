cd ../node-services/alerting-service
npm ci
npm run build
docker build -t alerting-service .