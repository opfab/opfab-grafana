# Opfab Grafana

The goal of this project is to create a service to link [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/) to [OperatorFabric](https://github.com/opfab/operatorfabric-core).

More specifically, it adds two main functionalities:
* Receiving Grafana alert nofitications through a webhook endpoint and converting them into Opfab cards

* Providing a mapping system, editable via the UI, to register a set of options (such as card recipients, severity, ...) for different groups of alerts

## How to execute

Assuming you have cloned the repository:

1. Start OperatorFabric and the alerting service
    * First build the alerting service's docker image
        ```
        cd node-services/alerting-service
        ./buildDockerImage.sh
        ```
    * Then start the dockers
        ```
        cd ../../server
        ./startServer.sh alerting
        ```
    * Alternatively, you can start the alerting service without a docker
        ```
        cd server
        ./startServer.sh
        ```
        ```
        cd ../node-services/alerting-service
        npm ci && npm start
        ```
        with this method, use another terminal for the next steps

2. Run the following command to create a new mapping for the provided Grafana alert rule
   ```
   curl -X POST http://localhost:2109/mapping/eee0zny1yjt34f -H "Content-Type: application/json" -d '{"recipients":["ENTITY1_FR"]}'
   ```

3. Publish bundle and configuration
   ```
   cd ../monitoring
   ./loadMonitoringConfig.sh
   ```

4. Open [localhost:2002](http://localhost:2002/) in your browser and log in using credentials `operator1_fr` / `test`

5. To test the alerting service, you can go to `node-services/alerting-test` and run `npm ci && npm start`. This will expose custom data to Grafana, and let you control the value (To trigger an alert, set the value above 10)

6. You can also go to [Mapping Administration](http://localhost:2002/#businessconfigparty/uid_test_2/) screen to edit mapping configuration