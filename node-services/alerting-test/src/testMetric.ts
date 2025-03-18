import express from 'express';
import {Gauge, register} from 'prom-client';
import readline from 'node:readline';

const app = express();
const port = 2110;

const testGauge = new Gauge({
    name: 'test_gauge',
    help: 'Gauge metric test',
    // labelNames: ['test_label']
});
testGauge.set(5);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getInput() {
    rl.question('Set value for test metric (alert fires above 10): ', (value) => {
        testGauge.set(Number(value));
        getInput();
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
