import express from 'express';
import config from 'config';
import {getLogger} from './common/logger';
import AlertService from './alertService';
import MappingService from './mapping/mappingService';

const port: string = config.get('operatorfabric.alerting.port');
const app = express();
const logger = getLogger();
const alertService = new AlertService(
    config.get('operatorfabric.alerting.cardTemplate'),
    config.get('operatorfabric.alerting.panelRangeOffset')
);
const mappingService = new MappingService(config.get('operatorfabric.alerting.mapping.configFilePath'));

app.use(express.json());

app.post('/alerts', (req, res) => {
    const alertNotification = req.body;
    logger.info(JSON.stringify(alertNotification, null, 4));

    alertNotification.alerts.forEach((alert: any) => {
        alertService.processAlert(alert);
    });
    res.send();
});

app.get('/mapping/config');

logger.info(`listening on port ${port}`);
// app.listen(port);
