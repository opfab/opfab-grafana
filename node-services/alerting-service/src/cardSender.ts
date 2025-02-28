import axios from 'axios';
import {getLogger} from './logger';

const cardPublicationUrl = 'http://127.0.0.1:2102/cards';
const authTokenUrl = 'http://127.0.0.1:2002/auth/token';
const login = 'opfab';
const password = 'test';
const logger = getLogger();

async function getToken() {
    const response = await axios({
        method: 'post',
        url: authTokenUrl,
        data: `username=${login}&password=${password}&grant_type=password`
    });
    const token = response?.data?.access_token;
    if (token == null) throw new Error(`no token provided, response: ${response}`);
    return token;
}

export async function sendCard(card: any) {
    try {
        const token = await getToken();
        await axios({
            method: 'post',
            url: cardPublicationUrl,
            data: card,
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    } catch (err) {
        logger.error('Error sending card:', err);
    }
}
