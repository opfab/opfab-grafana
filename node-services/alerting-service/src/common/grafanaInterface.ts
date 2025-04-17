import axios from 'axios';
import {getLogger} from './logger';
import config from 'config';

const grafanaUrl: string = config.get('grafana.url');
const logger = getLogger();

export async function getAlertRules(): Promise<any[]> {
    try {
        const response = await axios({
            method: 'get',
            url: grafanaUrl + '/api/v1/provisioning/alert-rules'
        });
        if (response?.data == null) throw new Error('no response data');
        return response.data;
    } catch (err) {
        logger.error('Impossible to get Grafana alert rules:', err);
        return [];
    }
}

export async function getFolders(): Promise<any[]> {
    try {
        const response = await axios({
            method: 'get',
            url: grafanaUrl + '/api/search?type=dash-folder'
        });
        if (response?.data == null) throw new Error('no response data');
        return response.data;
    } catch (err) {
        logger.error('Impossible to get Grafana folders:', err);
        return [];
    }
}
