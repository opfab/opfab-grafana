import axios from 'axios';
import {getLogger} from './logger';

const grafanaUrl = 'http://127.0.0.1:3000';
const logger = getLogger();

export async function getAlertRules(): Promise<any> {
    try {
        const response = await axios({
            method: 'get',
            url: grafanaUrl + '/api/v1/provisioning/alert-rules'
        });
        if (response?.data == null) throw new Error('no response data');
        else return response.data;
    } catch (err) {
        logger.error('Impossible to get Grafana alert rules:', err);
        return [];
    }
}
