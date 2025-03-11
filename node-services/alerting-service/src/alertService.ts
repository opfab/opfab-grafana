import {sendCard} from './common/opfabInterface';

export default class AlertService {
    private cardBase: any = {
        publisher: 'opfab',
        process: 'alertingProcess',
        processVersion: '1',
        groupRecipients: ['Dispatcher'],
        title: {key: 'alertingProcess.title'},
        summary: {key: 'alertingProcess.summary'}
    };
    private panelRangeOffset: number = 1000 * 60 * 1;
    private alertsCurrentStatus: Map<string, {status: string; startsAt: number}>;

    constructor() {
        this.alertsCurrentStatus = new Map();
    }

    public processAlert(alert: any) {
        alert.startsAt = new Date(alert.startsAt).valueOf();
        alert.endsAt = new Date(alert.endsAt).valueOf();
        const currentStatus = this.alertsCurrentStatus.get(alert.fingerprint);

        if (currentStatus !== undefined) {
            if (currentStatus.status === alert.status) return;
            if (alert.status === 'resolved') alert.startsAt = currentStatus.startsAt;
        }

        this.alertsCurrentStatus.set(alert.fingerprint, {status: alert.status, startsAt: alert.startsAt});
        const card = this.buildCard(alert);
        sendCard(card);
    }

    private buildCard(alert: any): any {
        const card = {...this.cardBase};

        card.processInstanceId = alert.fingerprint + alert.startsAt.toString();
        card.startDate = alert.startsAt;
        if (alert.status === 'firing') {
            card.state = 'firingState';
            card.severity = 'ALARM';
            card.data = {panelUrl: this.transformPanelUrl(alert.panelURL, alert.startsAt)};
        } else {
            card.state = 'resolvedState';
            card.severity = 'INFORMATION';
            card.data = {panelUrl: this.transformPanelUrl(alert.panelURL, alert.startsAt, alert.endsAt)};
        }
        return card;
    }

    private transformPanelUrl(panelUrl: string, startsAt: number, endsAt?: number): string {
        const rangeStart = startsAt - this.panelRangeOffset;
        const rangeEnd = endsAt ?? 'now';

        panelUrl = panelUrl.replace('/d/', '/d-solo/').replace('viewPanel', 'panelId');
        panelUrl += '&from=' + rangeStart + '&to=' + rangeEnd + '&timezone=browser';
        return panelUrl;
    }

    private extractUidFromGeneratorUrl(generatorUrl: string): string | null {
        const uid = generatorUrl.match(/grafana\/([^/]+)/);
        return uid != null ? uid[1] : null;
    }
}
