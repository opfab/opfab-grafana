# Opfab Grafana

The goal of this project is to create a service to link [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/) to [OperatorFabric](https://github.com/opfab/operatorfabric-core).

More specifically, it has two main purposes:

* Receiving Grafana alert nofitications through an HTTP endpoint and converting them into Opfab cards

* Providing a mapping system, editable in the UI, to customize the opfab card according to the received alert

## Introduction

This section explains the main concepts of this project

### Mapping system

**Alert rules** are the core component of the Grafana alerting system, each one contains a query to select data to measure and the condition that determines when to trigger an alert. They are organized within Grafana in a folder hierarchy (where each folder and alert rule is identified by a UID).

The mapping system associates a set of **card options** (such as title, severity, recipients, ...) with a specific **Grafana element** (alert rule or folder). Each mapping is a key-value pair: the key is the element's UID and the value is the object containing the options.

When receiving an alert, the final card options are computed traversing the path from the root folder to the alert rule that triggered the alert. For each element, if a mapping exists, the final options are updated with the ones from the mapping.

### Simulator

The data used by Grafana is mainly **time series** (series of measurements taken at regular time intervals).  
However Grafana does not store data itself. Instead it connects to **data sources** which are responsible for collecting and storing data (the data source we use is Prometheus).

The simulator is a small NodeJS application that generates fake measurements and exposes them via an HTTP endpoint, which Prometheus scrapes periodically. It lets the user control the generated measurements in the terminal, to trigger alerts at will.

### Demo scenarios

To easily demonstrate what this project does, two fictional scenarios are included using the simulator along with preconfigured Grafana alert rules.

Here is a breakdown of the scenarios:

* **Network frequency** - monitoring the current frequency on the network. One generated measurement representing the frequency in hertz. In normal state, oscillating around 50 Hz.

    Alert rules for this scenario (Grafana folder `Opfab/rules/network-frequency`) :

    * `high 2` (frequency > 50.5)
    * `high 1` (50.5 > frequency > 50.2)
    * `low 1` (49.5 < frequency < 49.8)
    * `low 2` (frequency < 49.5)

* **Network consumption** - monitoring the gap between the power consumption forecast and the real power consumption. Two generated measurements, one representing the forecast and the other the current consumption, both in gigawatt. In normal state, the gap is less than 2 GW.

    Alert rules for this scenario (Grafana folder `Opfab/rules/network-consumption`) :

    * `forecast gap` (gap > 2)

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

1. First create a new mapping using [Grafana mapping](http://localhost:2002/#/businessconfigparty/uid_test_3/) page:
    * As Grafana element, select `Opfab/rules` folder
    * For the card options select at least `Control Center FR North` as entity recipient

2. Start the simulator: go to `node-services/alerting-simulator/` and run `npm ci && npm start`

3. You will now see the simulator menu in the terminal, it allows you to change the state of each scenario independently. Enter the corresponding number to switch to the desired state, any other state than normal will trigger an alert.

## API Testing

Some integration tests are included using Karate framework.
To run them (after following How to start), use the script `runKarateTests.sh` in the `scripts` directory.