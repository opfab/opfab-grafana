import config from 'config';
import {getAlertRule, getAlertRules, getFolder, getFolders} from '../common/grafanaInterface';
import {getEntities} from '../common/opfabInterface';
import MappingConfig from './mappingConfig';
import MappingData from './mappingDataModel';

export default class MappingService {
    private mappingConfig: MappingConfig;
    private defaultMappingData: any;

    constructor(filePath: string, defaultMappingData: any) {
        this.mappingConfig = new MappingConfig(filePath);
        this.defaultMappingData = defaultMappingData;
    }

    public async getConfig(): Promise<any> {
        const grafanaStructure = new Map();
        const grafanaFolders = await Promise.all(
            (await getFolders()).map(async (folder) => [folder.uid, await this.getFolderName(folder.uid)])
        );
        const grafanaAlertRules = (await getAlertRules())
            .filter((rule) => rule.notification_settings?.receiver === config.get('grafana.contactPointName'))
            .map((rule) => {
                grafanaStructure.set(rule.uid, rule.folderUID);
                grafanaStructure.get(rule.folderUID)?.push(rule.uid) ??
                    grafanaStructure.set(rule.folderUID, [rule.uid]);
                return [rule.uid, rule.title];
            });

        const entities = (await getEntities()).map((entity) => [entity.id, entity.name]);
        const mappings = Array.from(this.mappingConfig.getAllMappings());

        return {grafanaFolders, grafanaAlertRules, grafanaStructure: Array.from(grafanaStructure), entities, mappings};
    }

    private async getFolderName(folderUid: string): Promise<string> {
        let path = '';
        const folder = await getFolder(folderUid);

        folder.parents?.forEach((parentFolder: any) => {
            path += parentFolder.title + '/';
        });
        return path + folder.title + '/';
    }

    public async computeMappingData(alertRuleUid: string): Promise<MappingData | undefined> {
        const dataResult: MappingData = {
            recipients: new Array<string>(),
            cardTitle: this.defaultMappingData.cardTitle,
            firingSeverity: this.defaultMappingData.firingSeverity,
            resolvedSeverity: this.defaultMappingData.resolvedSeverity
        };
        const path = await this.getPath(alertRuleUid);
        if (!path) return;

        path.forEach((elementUid) => {
            const data = this.mappingConfig.getMappingData(elementUid);
            if (data?.recipients) dataResult.recipients = [...new Set(dataResult.recipients.concat(data.recipients))];
            if (data?.cardTitle) dataResult.cardTitle = data.cardTitle;
            if (data?.firingSeverity) dataResult.firingSeverity = data.firingSeverity;
            if (data?.resolvedSeverity) dataResult.resolvedSeverity = data.resolvedSeverity;
        });
        return dataResult;
    }

    private async getPath(alertRuleUid: string): Promise<string[] | undefined> {
        const folderUid = (await getAlertRule(alertRuleUid)).folderUID;
        if (!folderUid) return;

        const parentFoldersUid = (await getFolder(folderUid)).parents?.map((parentFolder: any) => parentFolder.uid) ?? [];

        return [...parentFoldersUid, folderUid, alertRuleUid];
    }

    public setMapping(elementUid: string, data: MappingData): void {
        this.mappingConfig.setMapping(elementUid, data);
    }

    public deleteMapping(elementUid: string): void {
        this.mappingConfig.deleteMapping(elementUid);
    }
}
