# Opfab Grafana

The goal of this project is to create a service to link [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/) to [OperatorFabric](https://github.com/opfab/operatorfabric-core).

More specifically, it has two main purposes:

* Receiving Grafana alert nofitications through an HTTP endpoint and converting them into Opfab cards

* Providing a mapping system, editable via the UI, that links various options (such as card recipients, severity, ...) to specific Grafana elements (folders or alert rules)

## How to start

Assuming you have cloned the repository:

1. Start OperatorFabric
    ```
    cd scripts
    ./startServer.sh
    ```

2. Start the alerting service
    * In a docker container
        ```
        ./buildDockerImage.sh
        ./startAlertingService.sh docker
        ```
    * Or directly in the terminal (use another terminal for next steps)
        ```
        ./startAlertingService.sh
        ```

3. Publish business config for the alerting process
    ```
    ./uploadBusinessConfig.sh
    ```

You can now open [localhost:2002](http://localhost:2002/) in your browser and log in using credentials `operator1_fr` / `test`.  
To see and manage mappings, go to [Grafana mapping](http://localhost:2002/#/businessconfigparty/uid_test_3/) page.

## Demo

To easily demonstrate what this project does, two example scenarios are included using a simulator that generates custom data for Grafana, along with preconfigured Grafana panels and alert rules.

1. First create a new mapping using [Grafana mapping](http://localhost:2002/#/businessconfigparty/uid_test_3/) page:
    * As Grafana element, select `Opfab/` folder
    * For the options select at least `Control Center FR North` in entity recipients

    The selected options will affect every alert triggered by alert rules in the Opfab folder and its subfolders.

2. To start the simulator, go to `node-services/alerting-simulator/` and run `npm ci && npm start`

3. You will now see a menu in the terminal, it allows you to change the state of each scenario independently. Enter the corresponding number to switch to the desired state, any other state than normal will trigger an alert.

## API Testing

Some integration tests are included using Karate framework.
To run them (after following How to start), use the script `runKarateTests.sh` in the `scripts` directory.
