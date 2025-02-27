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
const panelRangeOffset = 1000 * 60 * 1;
const alertsCurrentStatus = new Map<string, {status: string; startsAt: number}>();

function processAlert(alert: any) {
    alert.startsAt = new Date(alert.startsAt).valueOf();
    alert.endsAt = new Date(alert.endsAt).valueOf();
    const currentStatus = alertsCurrentStatus.get(alert.fingerprint);

    if (currentStatus !== undefined) {
        if (currentStatus.status === alert.status) return;
        if (alert.status === 'resolved') alert.startsAt = currentStatus.startsAt;
    }

    alertsCurrentStatus.set(alert.fingerprint, {status: alert.status, startsAt: alert.startsAt});
    const card = buildCard(alert);
    sendCard(card);
}

function buildCard(alert: any): any {
    const card = {...cardBase};

    card.processInstanceId = alert.fingerprint + alert.startsAt.toString();
    card.startDate = alert.startsAt;
    if (alert.status === 'firing') {
        card.state = 'firingState';
        card.severity = 'ALARM';
        card.data = {panelUrl: transformPanelUrl(alert.panelURL, alert.startsAt)};
    } else {
        card.state = 'resolvedState';
        card.severity = 'INFORMATION';
        card.data = {panelUrl: transformPanelUrl(alert.panelURL, alert.startsAt, alert.endsAt)};
    }
    return card;
}

function transformPanelUrl(panelUrl: string, startsAt: number, endsAt?: number): string {
    const rangeStart = startsAt - panelRangeOffset;
    const rangeEnd = endsAt ?? 'now';

    panelUrl = panelUrl.replace('/d/', '/d-solo/').replace('viewPanel', 'panelId');
    panelUrl += '&from=' + rangeStart + '&to=' + rangeEnd + '&timezone=browser';
    return panelUrl;
}

app.use(express.json());

app.post('/alert', (req, res) => {
    const alertNotification = req.body;
    logger.info(JSON.stringify(alertNotification, null, 4));

    alertNotification.alerts.forEach((alert: any) => {
        processAlert(alert);
    });
    res.send();
});

logger.info(`listening on port ${port}`);
app.listen(port);
