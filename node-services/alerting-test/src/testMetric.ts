import express from 'express';
import {Gauge, register} from 'prom-client';
import readline from 'node:readline';

const port = 2110;
const intervalsId = new Map();
const ranges = [
    {start: 50, min: 49.85, max: 50.15},
    {start: 50.35, min: 50.3, max: 50.4},
    {start: 50.65, min: 50.6, max: 50.7},
    {start: 49.65, min: 49.6, max: 49.7},
    {start: 49.35, min: 49.3, max: 49.4}
];
const gauge = new Gauge({
    name: 'network_frequency_hertz',
    help: 'network frequency',
    labelNames: ['zone']
});

setRange('France', ranges[0]);
setRange('Spain', ranges[0]);

function setRange(zone: string, range: any) {
    const intervalId = intervalsId.get(zone);
    if (intervalId) clearInterval(intervalId);

    gauge.set({zone: zone}, range.start);
    const newIntervalId = setInterval(async () => {
        const value = (await gauge.get()).values.find((v) => v.labels.zone === zone)?.value;

        while (1) {
            const inc = Math.random() * 0.2 - 0.1;
            if (value && value + inc > range.min && value + inc < range.max) {
                gauge.inc({zone: zone}, inc);
                break;
            }
        }
    }, 5000);
    intervalsId.set(zone, newIntervalId);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getInput() {
    console.log('\nSet frequency for zone France:\n1 - Normal\n2 - High\n3 - Very high\n4 - Low\n5 - Very low\n');
    rl.question('> ', (input) => {
        setRange('France', ranges[Number(input)-1]);
        getInput();
    });
}

const app = express();
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
});

app.listen(port, () => {
    console.log(`listening on port ${port}`);
    getInput();
});
