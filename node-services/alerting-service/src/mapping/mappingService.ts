import config from 'config';
import {getAlertRules, getFolders} from '../common/grafanaInterface';
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
        const grafanaFolders = new Map((await getFolders()).map((folder) => [folder.uid, folder.title]));
        const alertRules = (await getAlertRules()).reduce((validRules: any[], rule) => {
            if (rule.notification_settings?.receiver === config.get('grafana.contactPointName')) {
                const folderName = grafanaFolders.get(rule.folderUID) ?? '?';
                validRules.push([rule.uid, folderName + '/' + rule.title]);
            }
            return validRules;
        }, []);
        const entities = (await getEntities()).map((entity: any) => [entity.id, entity.name]);
        const mappings = Array.from(this.mappingConfig.getAllMappings());

        return {alertRules, entities, mappings};
    }

    public getDefaultMappingData(): any {
        return this.defaultMappingData;
    }

    public getMappingData(alertRuleUid: string): MappingData | undefined {
        return this.mappingConfig.getMappingData(alertRuleUid);
    }

    public setMapping(alertRuleUid: string, data: MappingData): void {
        this.mappingConfig.setMapping(alertRuleUid, data);
    }

    public deleteMapping(alertRuleUid: string): void {
        this.mappingConfig.deleteMapping(alertRuleUid);
    }
}
