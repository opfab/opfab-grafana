import express from 'express';
import {Gauge, register} from 'prom-client';
import readline from 'node:readline';

const port = 2110;
const menuStates = {
    frequency: 'Normal',
    consumption: 'Normal'
};
const frequencyOptions = [
    {start: 50, range: [49.85, 50.15]},
    {start: 50.35, range: [50.3, 50.4]},
    {start: 50.65, range: [50.6, 50.7]},
    {start: 49.65, range: [49.6, 49.7]},
    {start: 49.35, range: [49.3, 49.4]}
];
let frequencyValue = frequencyOptions[0].start;
let frequencyRange = frequencyOptions[0].range;
let consumptionValue = 40;
let consumptionGap = 0;

const frequencyGauge = new Gauge({
    name: 'network_frequency_hz',
    help: 'empty'
});
const consumptionGauge = new Gauge({
    name: 'power_consumption_gw',
    help: 'empty',
    labelNames: ['type']
});
frequencyGauge.set(frequencyValue);
consumptionGauge.set({type: '1'}, consumptionValue);
consumptionGauge.set({type: '2'}, consumptionValue);

setInterval(() => {
    while (1) {
        const frequencyNewValue = frequencyValue + (Math.random() * 0.2 - 0.1);
        if (frequencyNewValue > frequencyRange[0] && frequencyNewValue < frequencyRange[1]) {
            frequencyValue = frequencyNewValue;
            break;
        }
    }
    while (1) {
        const consumptionNewValue = consumptionValue + (Math.random() * 10 - 5);
        if (consumptionNewValue > 30 && consumptionNewValue < 50) {
            consumptionValue = consumptionNewValue;
            break;
        }
    }
    if (Math.abs(consumptionGap) < 2) {
        while (1) {
            const gapChange = Math.random() * 0.4 + 0.4;
            const consumptionNewGap = Math.random() < 0.5
                ? consumptionGap + gapChange
                : consumptionGap - gapChange;
            if (Math.abs(consumptionNewGap) < 2) {
                consumptionGap = consumptionNewGap;
                break;
            }
        }
    }

    frequencyGauge.set(frequencyValue);
    consumptionGauge.set({type: '1'}, consumptionValue + consumptionGap);
    consumptionGauge.set({type: '2'}, consumptionValue);
}, 5000);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getInput() {
    console.log(`\n-- Alert trigger --\n\nNetwork frequency (${menuStates.frequency}):\n1 - Normal state\n2 - High\n3 - Very high\n4 - Low\n5 - Very low\n\nNetwork consumption (${menuStates.consumption}):\n6 - Normal state\n7 - High\n8 - Low`);
    rl.question('\n> ', (input) => {
        const choice = Number(input);
        switch (choice) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
                frequencyRange = frequencyOptions[choice-1].range;
                frequencyValue = frequencyOptions[choice-1].start;
                frequencyGauge.set(frequencyValue);
                menuStates.frequency = ['Normal', 'High', 'Very high', 'Low', 'Very low'][choice-1];
                break;
            case 6:
                consumptionGap = 0;
                menuStates.consumption = 'Normal';
                break;
            case 7:
                consumptionGap = 3;
                menuStates.consumption = 'High';
                break;
            case 8:
                consumptionGap = -3;
                menuStates.consumption = 'Low';
                break;
        }
        getInput();
    });
}

const app = express();
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
});

app.listen(port, () => {
    getInput();
});
