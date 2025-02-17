export current_date_in_milliseconds_from_epoch=$(($(date +%s%N)/1000000))
curl -X POST http://localhost:2102/cards -H "Content-type:application/json" --data "$(envsubst <$1)"