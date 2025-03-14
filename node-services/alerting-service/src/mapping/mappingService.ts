import config from 'config';
import {getAlertRules} from '../common/grafanaInterface';
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
        let alertRules = await getAlertRules();
        let entities = await getEntities();
        const mappings = Object.fromEntries(this.mappingConfig.getAllMappings());

        alertRules = alertRules.reduce((validRules: any[], rule: any) => {
            if (rule.notification_settings?.receiver === config.get('grafana.contactPointName')) {
                validRules.push({
                    uid: rule.uid,
                    title: rule.title,
                    folderUid: rule.folderUID
                });
            }
            return validRules;
        }, []);
        entities = entities.map((entity: any) => ({
            id: entity.id,
            name: entity.name
        }));

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
