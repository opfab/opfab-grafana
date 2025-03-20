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

    public processAlert(alert: any): void {
        alert.ruleUid = this.extractUidFromGeneratorUrl(alert.generatorURL);
        alert.startsAt = new Date(alert.startsAt).valueOf();
        alert.endsAt = new Date(alert.endsAt).valueOf();
        const currentStatus = this.alertsCurrentStatus.get(alert.fingerprint);

        if (currentStatus !== undefined) {
            if (currentStatus.status === alert.status) return;
            if (alert.status === 'resolved') alert.startsAt = currentStatus.startsAt;
        }

        this.alertsCurrentStatus.set(alert.fingerprint, {status: alert.status, startsAt: alert.startsAt});
        const card = this.buildCard(alert);
        if (card === undefined) {
            this.logger.warn(`Card not sent: no recipients mapped for alert rule ${alert.ruleUid}`);
            return;
        }
        sendCard(card);
    }

    private buildCard(alert: any): any {
        const defaultMappingData = this.mappingService.getDefaultMappingData();
        const mappingData = this.mappingService.getMappingData(alert.ruleUid);
        if (mappingData?.recipients === undefined) return;
        const card = {...this.cardTemplate};

        card.processInstanceId = alert.fingerprint + alert.startsAt.toString();
        card.startDate = alert.startsAt;
        card.entityRecipients = mappingData.recipients;
        card.title = {key: 'alertingProcess.title'};
        card.summary = {key: 'alertingProcess.summary'};
        card.data = {alertName: alert.labels.grafana_folder + '/' + alert.labels.alertname};
        if (alert.status === 'firing') {
            card.state = 'firingState';
            card.severity = mappingData?.firingSeverity ?? defaultMappingData.firingSeverity;
            card.data.panelUrl = this.transformPanelUrl(alert.panelURL, alert.startsAt);
        } else {
            card.state = 'resolvedState';
            card.severity = mappingData?.resolvedSeverity ?? defaultMappingData.resolvedSeverity;
            card.data.panelUrl = this.transformPanelUrl(alert.panelURL, alert.startsAt, alert.endsAt);
            card.endDate = alert.endsAt;
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

    private extractUidFromGeneratorUrl(generatorUrl: string): string {
        const uid = generatorUrl.match(/grafana\/([^/]+)/);
        return uid != null ? uid[1] : '';
    }
}
