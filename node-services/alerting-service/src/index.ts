import express from 'express';
import {getLogger} from './logger';
import {sendCard} from './cardSender';

const port = 2109;
const app = express();
const logger = getLogger();
const cardBase: any = {
    publisher: 'opfab',
    process: 'alertingProcess',
    processVersion: '1',
    groupRecipients: ['Dispatcher'],
    title: {key: 'alertingProcess.title'},
    summary: {key: 'alertingProcess.summary'}
};
let instanceId = 0;

app.use(express.json());

app.post('/alert', (req, res) => {
    const alertNotificationData = req.body;
    logger.info(JSON.stringify(alertNotificationData, null, 4));

    alertNotificationData.alerts.forEach((alertData: any) => {
        const card = buildCard(alertData);
        sendCard(card);
    });
    res.send();
});

function buildCard(alertData: any) {
    const card = {...cardBase};

    instanceId++;
    card.processInstanceId = instanceId;
    card.startDate = new Date().valueOf();
    card.data = {panelUrl: transformPanelUrl(alertData.panelURL)};
    if (alertData.status === 'firing') {
        card.state = 'firingState';
        card.severity = 'ALARM';
    } else {
        card.state = 'resolvedState';
        card.severity = 'INFORMATION';
    }
    return card;
}

function transformPanelUrl(panelUrl: string) {
    return panelUrl.replace('/d/', '/d-solo/').replace('viewPanel=', 'panelId=');
}

logger.info(`listening on port ${port}`);
app.listen(port);
