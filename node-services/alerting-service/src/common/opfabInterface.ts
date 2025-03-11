import axios from 'axios';
import {getLogger} from './logger';

const cardPublicationUrl = 'http://127.0.0.1:2102';
const usersUrl = 'http://127.0.0.1:2103';
const authTokenUrl = 'http://127.0.0.1:2002/auth/token';
const login = 'opfab';
const password = 'test';
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
            url: cardPublicationUrl + '/cards',
            data: card,
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    } catch (err) {
        logger.error('Impossible to send card:', err);
    }
}

export async function getEntities(): Promise<any> {
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
        else return response.data;
    } catch (err) {
        logger.error('Impossible to get entities:', err);
        return [];
    }
}
