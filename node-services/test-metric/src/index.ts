import express from 'express';
import {Gauge, register} from 'prom-client';
import readline from 'node:readline';

const app = express();
const port = 2110;
const baseValue = 5;

const gaugeTest = new Gauge({
    name: 'node_service_gauge_test',
    help: 'Gauge metric test'
});
gaugeTest.set(baseValue);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getInput() {
    rl.question('Test gauge value for 10s : ', (res) => {
        gaugeTest.set(Number(res));

        setTimeout(() => {
            gaugeTest.set(baseValue);
            getInput();
        }, 10000);
    });
}

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
});

app.listen(port, () => {
    console.log(`listening on port ${port}`);
    getInput();
});
