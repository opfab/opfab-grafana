import express from 'express';
import {Gauge, register} from 'prom-client';
import readline from 'node:readline';

const app = express();
const port = 2110;
const baseValues = [5, 7];

const testGauge = new Gauge({
    name: 'test_gauge',
    help: 'Gauge metric test',
    labelNames: ['test_label']
});
testGauge.set({test_label: 0}, baseValues[0]);
testGauge.set({test_label: 1}, baseValues[1]);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getInput() {
    rl.question('test_gauge increase value for 10s : ', (value) => {
        testGauge.inc({test_label: 0}, Number(value));
        testGauge.inc({test_label: 1}, Number(value));

        setTimeout(() => {
            testGauge.set({test_label: 0}, baseValues[0]);
            testGauge.set({test_label: 1}, baseValues[1]);
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
