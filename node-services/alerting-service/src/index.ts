import config from 'config';
import express from 'express';
import {getLogger} from './common/logger';
import AlertService from './alertService';
import MappingService from './mapping/mappingService';
import MappingData from './mapping/mappingDataModel';
import {expressjwt} from 'express-jwt';
import JwksRsa from 'jwks-rsa';

const port: string = config.get('operatorfabric.alerting.port');
const app = express();
const logger = getLogger();

const mappingService = new MappingService(
    config.get('operatorfabric.alerting.mapping.configFilePath'),
    config.get('operatorfabric.alerting.mapping.defaultMappingData')
);
const alertService = new AlertService(
    config.get('operatorfabric.alerting.cardTemplate'),
    config.get('operatorfabric.alerting.panelRangeOffsetMs'),
    mappingService
);

app.disable('x-powered-by');
app.use(express.json());
app.use(
    /^\/(?!alerts$).*/,
    expressjwt({
        secret: JwksRsa.expressJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
            jwksUri: config.get('operatorfabric.jwk-set-uri')
        }),
        algorithms: ['RS256']
    })
);

app.post('/alerts', async (req, res) => {
    const alertNotification = req.body;
    logger.info(JSON.stringify(alertNotification, null, 4));

    for (const alert of alertNotification.alerts) {
        await alertService.processAlert(alert);
    }
    res.send();
});

app.get('/mapping', async (req, res) => {
    res.send(await mappingService.getConfig());
});

app.post('/mapping/:uid', (req, res) => {
    const elementUid: string = req.params.uid;
    const data: MappingData = req.body;

    mappingService.setMapping(elementUid, data);
    res.status(204).send();
});

app.delete('/mapping/:uid', (req, res) => {
    const elementUid: string = req.params.uid;

    mappingService.deleteMapping(elementUid);
    res.status(204).send();
});

app.use((err: any, req: any, res: any, next: any): void => {
    if (err.name === 'UnauthorizedError') {
        logger.warn('SECURITY : try to access resource ' + req.originalUrl + ' without valid token');
        res.status(401).send('Invalid token');
    } else {
        next(err);
    }
});

app.listen(port, () => {
    logger.info(`listening on port ${port}`);
});
