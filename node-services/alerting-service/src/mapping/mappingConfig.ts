import fs from 'fs';
import CardOptions from './cardOptionsModel';

export default class MappingConfig {
    private filePath: string;
    private mappings: Map<string, CardOptions>;

    constructor(filePath: string) {
        this.filePath = filePath;

        if (fs.existsSync(this.filePath)) this.load();
        else {
            this.mappings = new Map();
            this.save();
        }
    }

    private load(): void {
        const configJson = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        this.mappings = new Map(Object.entries(configJson));
    }

    private save(): void {
        const configJson = Object.fromEntries(this.mappings);
        fs.writeFileSync(this.filePath, JSON.stringify(configJson));
    }

    public getAllMappings(): Map<string, CardOptions> {
        return this.mappings;
    }

    public getCardOptions(elementUid: string): CardOptions | undefined {
        return this.mappings.get(elementUid);
    }

    public setMapping(elementUid: string, cardOptions: CardOptions): void {
        this.mappings.set(elementUid, cardOptions);
        this.save();
    }

    public deleteMapping(elementUid: string): void {
        this.mappings.delete(elementUid);
        this.save();
    }
}
