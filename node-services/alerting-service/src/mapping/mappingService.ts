import MappingConfig from './mappingConfig';

export default class MappingService {
    private mappingConfig: MappingConfig;

    constructor(filePath: string) {
        this.mappingConfig = new MappingConfig(filePath);
    }
}
