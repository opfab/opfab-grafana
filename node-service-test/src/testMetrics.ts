import express from 'express';
import { Gauge, register } from 'prom-client';


const gaugeTest = new Gauge({
    name: 'node_service_gauge_test',
    help: 'Gauge metric test'
});

let cycle = [5, 6, 3, 3, 4, 5, 5, 6, 8, 12];
setInterval(async () => {
    const value = cycle.shift();
    if (value !== undefined) {
        cycle.push(value);
        gaugeTest.set(value);
    }
}, 10000);

const app = express();

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
});

const port = 2110;
console.log(`listening on port ${port}`);
app.listen(port);
