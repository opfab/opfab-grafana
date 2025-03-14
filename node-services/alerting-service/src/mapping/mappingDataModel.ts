export default interface MappingData {
    recipients: string[];
    firingSeverity: Severity;
    resolvedSeverity: Severity;
}

enum Severity {
    'ALARM',
    'ACTION',
    'COMPLIANT',
    'INFORMATION'
}
