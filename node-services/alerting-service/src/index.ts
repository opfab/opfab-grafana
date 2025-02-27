import express from 'express';
import {getLogger} from './logger';
import {sendCard} from './cardSender';

const port = 2109;
const app = express();
const logger = getLogger();

app.use(express.json());

app.post('/alert', (req, res) => {
    logger.info(JSON.stringify(req.body));
    res.send();
});

logger.info(`listening on port ${port}`);
//app.listen(port);

const test_card = {
    publisher: 'opfab',
    processVersion: '2',
    process: 'monitoringProcess',
    processInstanceId: 'panel-1',
    state: 'panelState',
    groupRecipients: ['Dispatcher'],
    severity: 'INFORMATION',
    startDate: new Date().valueOf(),
    summary: {key: 'monitoringProcess.summary'},
    title: {key: 'monitoringProcess.panelTitle'},
    data: {
        url: 'http://localhost:3000/d-solo/ce3mo0w8g2jnkd/opfab-dashboard?from=&to=now&timezone=browser&orgId=1&panelId=2&__feature.dashboardSceneSolo'
    }
};

sendCard(test_card);
