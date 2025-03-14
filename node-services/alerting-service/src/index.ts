import config from 'config';
import express from 'express';
import {getLogger} from './common/logger';
import AlertService from './alertService';
import MappingService from './mapping/mappingService';

const port: string = config.get('operatorfabric.alerting.port');
const app = express();
const logger = getLogger();
const mappingService = new MappingService(
    config.get('operatorfabric.alerting.mapping.configFilePath'),
    config.get('operatorfabric.alerting.mapping.defaultMappingData')
);
const alertService = new AlertService(
    config.get('operatorfabric.alerting.cardTemplate'),
    config.get('operatorfabric.alerting.panelRangeOffset'),
    mappingService
);

app.disable('x-powered-by');
app.use(express.json());

app.post('/alerts', (req, res) => {
    const alertNotification = req.body;
    logger.info(JSON.stringify(alertNotification, null, 4));

    alertNotification.alerts.forEach((alert: any) => {
        alertService.processAlert(alert);
    });
    res.send();
});

app.get('/mapping/config', (req, res) => {
    res.send(mappingService.getConfig());
});

app.post('/mapping', (req, res) => {});

logger.info(`listening on port ${port}`);
app.listen(port);

// mappingService.getConfig().then((r) => logger.info(JSON.stringify(r, null, 4)));
