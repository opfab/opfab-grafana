# Opfab Grafana

The goal of this project is to create a service to link [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/) to [OperatorFabric](https://github.com/opfab/operatorfabric-core).

More specifically, it adds two main functionalities:
* Receiving Grafana alert nofitications through a webhook endpoint and converting them into Opfab cards

* Providing a mapping system, editable via the UI, to register a set of options (such as card recipients, severity, ...) for different groups of alerts

## How to execute

Assuming you have cloned the repository:

1. Launch the server
   ```
   cd server
   ./startServer.sh
   ```

2. Publish bundle and configuration
   ```
   cd ../monitoring
   ./loadMonitoringConfig.sh
   ```

3. Start the alerting service
   ```
   cd ../node-services/alerting-service
   npm ci
   npm start
   ```

4. Open [localhost:2002](http://localhost:2002/) in your browser and log in using credentials `operator1_fr` / `test`

5. In a new terminal, run the following command to add a new mapping to the mappingConfig
   ```
   curl -X POST http://localhost:2109/mapping/eee0zny1yjt34f -H "Content-Type: application/json" -d '{"recipients":["ENTITY1_FR"]}'
   ```

6. To test the alerting service, you can go to `node-services/alerting-test` and run `npm ci && npm start`. This will expose custom data to Grafana, and let you control the value (To trigger an alert, set the value above 10)

7. You can also go to [Mapping Administration](http://localhost:2002/#businessconfigparty/uid_test_2/) screen to edit mapping configuration