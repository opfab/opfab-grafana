import axios from 'axios';
import {getLogger} from './logger';
import config from 'config';

const authTokenUrl: string = config.get('operatorfabric.servicesUrls.authToken');
const cardsPublicationUrl: string = config.get('operatorfabric.servicesUrls.cardsPublication');
const usersUrl: string = config.get('operatorfabric.servicesUrls.users');
const login: string = config.get('operatorfabric.internalAccount.login');
const password: string = config.get('operatorfabric.internalAccount.password');
const logger = getLogger();

async function getToken(): Promise<any> {
    const response = await axios({
        method: 'post',
        url: authTokenUrl,
        data: `username=${login}&password=${password}&grant_type=password`
    });
    const token = response?.data?.access_token;
    if (token == null) throw new Error(`no token provided, response: ${response}`);
    return token;
}

export async function sendCard(card: any): Promise<void> {
    try {
        const token = await getToken();
        await axios({
            method: 'post',
            url: cardsPublicationUrl + '/cards',
            data: card,
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    } catch (err) {
        logger.error('Impossible to send card:', err);
    }
}

export async function getEntities(): Promise<any[]> {
    try {
        const token = await getToken();
        const response = await axios({
            method: 'get',
            url: usersUrl + '/entities',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (response?.data == null) throw new Error('no response data');
        return response.data;
    } catch (err) {
        logger.error('Impossible to get entities:', err);
        return [];
    }
}
