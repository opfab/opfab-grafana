export interface MappingConfigModel {
    mappings: {
        alertRuleUid: string;
        data: MappingData;
    }[];
}

export interface MappingData {
    recipients: string[];
    severity: Severity;
}

enum Severity {
    'ALARM',
    'ACTION',
    'COMPLIANT',
    'INFORMATION'
}
