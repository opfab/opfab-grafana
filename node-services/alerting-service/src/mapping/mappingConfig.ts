import fs from 'fs';
import {MappingConfigModel, MappingData} from './mappingConfigModel';

export default class MappingConfig {
    private filePath: string;
    private config: Map<string, MappingData>;

    constructor(filePath: string) {
        this.filePath = filePath;

        if (fs.existsSync(this.filePath)) this.load();
        else {
            this.config = new Map();
            this.save();
        }
    }

    private load(): void {
        const configJson: MappingConfigModel = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        this.config = new Map(configJson.mappings.map((m) => [m.alertRuleUid, m.data]));
    }

    private save(): void {
        const configJson: MappingConfigModel = {
            mappings: Array.from(this.config, ([alertRuleUid, data]) => ({alertRuleUid, data}))
        };
        fs.writeFileSync(this.filePath, JSON.stringify(configJson));
    }

    public getAllMappings(): Map<string, MappingData> {
        return this.config;
    }

    public getMappingData(alertRuleUid: string): MappingData | undefined {
        return this.config.get(alertRuleUid);
    }

    public setMappingData(alertRuleUid: string, data: MappingData): void {
        this.config.set(alertRuleUid, data);
        this.save();
    }
}
