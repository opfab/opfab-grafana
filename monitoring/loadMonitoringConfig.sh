# Get the access token
source getToken.sh

cd bundle 
tar -czvf bundle.tar.gz config.json i18n.json css/ template/
mv bundle.tar.gz ../
cd ..

# Send bundle
curl -s -v -X POST "http://localhost:2100/businessconfig/processes" -H  "accept: application/json" -H  "Content-Type: multipart/form-data" -H "Authorization:Bearer $token" -F "file=@bundle.tar.gz;type=application/gzip"

# Create perimeter
curl -X POST http://localhost:2103/perimeters -H "Content-type:application/json" -H "Authorization:Bearer $token" --data @perimeter.json

# Add perimeter to group
curl -X PUT http://localhost:2103/perimeters/monitoring-Perimeter/groups -H "Content-type:application/json" -H "Authorization:Bearer $token" --data "[\"Dispatcher\"]"

