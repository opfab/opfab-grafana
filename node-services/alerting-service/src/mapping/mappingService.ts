import config from 'config';
import {getAlertRule, getAlertRules, getFolder, getFolders} from '../common/grafanaInterface';
import {getEntities} from '../common/opfabInterface';
import MappingConfig from './mappingConfig';
import CardOptions from './cardOptionsModel';

export default class MappingService {
    private mappingConfig: MappingConfig;
    private defaultCardOptions: any;

    constructor(filePath: string, defaultCardOptions: any) {
        this.mappingConfig = new MappingConfig(filePath);
        this.defaultCardOptions = defaultCardOptions;
    }

    public async getConfig(): Promise<any> {
        const grafanaStructure = new Map();
        const grafanaFolders = await Promise.all(
            (await getFolders()).map(async (folder) => [folder.uid, await this.getFolderName(folder.uid)])
        );
        const grafanaAlertRules = (await getAlertRules())
            .filter((rule) => rule.notification_settings?.receiver === config.get('grafana.contactPoint.name'))
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

    public async computeCardOptions(alertRuleUid: string): Promise<CardOptions | undefined> {
        const computedOptions: CardOptions = {
            recipients: new Array<string>(),
            title: this.defaultCardOptions.title,
            firingSeverity: this.defaultCardOptions.firingSeverity,
            resolvedSeverity: this.defaultCardOptions.resolvedSeverity
        };
        const path = await this.getPath(alertRuleUid);
        if (!path) return;

        path.forEach((elementUid) => {
            const options = this.mappingConfig.getCardOptions(elementUid);
            if (options?.recipients) computedOptions.recipients = [...new Set(computedOptions.recipients.concat(options.recipients))];
            if (options?.title) computedOptions.title = options.title;
            if (options?.firingSeverity) computedOptions.firingSeverity = options.firingSeverity;
            if (options?.resolvedSeverity) computedOptions.resolvedSeverity = options.resolvedSeverity;
        });
        return computedOptions;
    }

    private async getPath(alertRuleUid: string): Promise<string[] | undefined> {
        const folderUid = (await getAlertRule(alertRuleUid)).folderUID;
        if (!folderUid) return;

        const parentFoldersUid = (await getFolder(folderUid)).parents?.map((parentFolder: any) => parentFolder.uid) ?? [];

        return [...parentFoldersUid, folderUid, alertRuleUid];
    }

    public setMapping(elementUid: string, cardOptions: CardOptions): void {
        this.mappingConfig.setMapping(elementUid, cardOptions);
    }

    public deleteMapping(elementUid: string): void {
        this.mappingConfig.deleteMapping(elementUid);
    }
}
