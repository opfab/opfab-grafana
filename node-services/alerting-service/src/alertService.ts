import {getLogger} from './common/logger';
import {sendCard} from './common/opfabInterface';
import MappingService from './mapping/mappingService';

export default class AlertService {
    private cardTemplate: any;
    private panelRangeOffset: number;
    private mappingService: MappingService;
    private alertsCurrentStatus: Map<string, {status: string; startsAt: number}>;
    private logger;

    constructor(cardTemplate: any, panelRangeOffset: number, mappingService: MappingService) {
        this.cardTemplate = cardTemplate;
        this.panelRangeOffset = panelRangeOffset;
        this.mappingService = mappingService;
        this.alertsCurrentStatus = new Map();
        this.logger = getLogger();
    }

    public async processAlert(alert: any): Promise<void> {
        alert.ruleUid = this.extractUid(alert.generatorURL);
        alert.startsAt = new Date(alert.startsAt).valueOf();
        alert.endsAt = new Date(alert.endsAt).valueOf();
        const currentStatus = this.alertsCurrentStatus.get(alert.fingerprint);

        if (currentStatus !== undefined) {
            if (currentStatus.status === alert.status) return;
            if (alert.status === 'resolved') alert.startsAt = currentStatus.startsAt;
        }

        this.alertsCurrentStatus.set(alert.fingerprint, {status: alert.status, startsAt: alert.startsAt});
        const card = await this.buildCard(alert);
        if (card === undefined) {
            this.logger.warn(`Card not sent: no recipients found for alert rule '${alert.ruleUid}'`);
            return;
        }
        sendCard(card);
    }

    private async buildCard(alert: any): Promise<any> {
        const mappingData = await this.mappingService.computeMappingData(alert.ruleUid);
        if (!mappingData?.recipients.length) return;
        const card = {...this.cardTemplate};

        card.processInstanceId = alert.fingerprint + alert.startsAt.toString();
        card.startDate = alert.startsAt;
        card.entityRecipients = mappingData.recipients;
        card.title = {key: 'alertingProcess.title'};
        card.summary = {key: 'alertingProcess.summary'};
        card.data = {alertName: alert.labels.grafana_folder + '/' + alert.labels.alertname};
        if (alert.status === 'firing') {
            card.state = 'firingState';
            card.severity = mappingData.firingSeverity;
            card.data.panelUrl = this.transformPanelUrl(alert.panelURL, alert.startsAt - this.panelRangeOffset);
            card.data.archivePanelUrl = this.transformPanelUrl(
                alert.panelURL,
                alert.startsAt - this.panelRangeOffset,
                alert.startsAt + this.panelRangeOffset
            );
        } else {
            card.endDate = alert.endsAt;
            card.state = 'resolvedState';
            card.severity = mappingData.resolvedSeverity;
            card.data.panelUrl = this.transformPanelUrl(
                alert.panelURL,
                alert.startsAt - this.panelRangeOffset,
                alert.endsAt
            );
        }
        return card;
    }

    private transformPanelUrl(panelUrl: string, rangeStart: number, rangeEnd: string | number = 'now'): string {
        panelUrl = panelUrl.replace('/d/', '/d-solo/').replace('viewPanel', 'panelId');
        panelUrl += '&from=' + rangeStart + '&to=' + rangeEnd + '&timezone=browser&refresh=1s';
        return panelUrl;
    }

    private extractUid(generatorUrl: string): string {
        const uid = generatorUrl.match(/grafana\/([^/]+)/);
        return uid != null ? uid[1] : '';
    }
}
