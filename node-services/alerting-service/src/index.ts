import config from 'config';
import express from 'express';
import {getLogger} from './common/logger';
import AlertService from './alertService';
import MappingService from './mapping/mappingService';
import MappingData from './mapping/mappingDataModel';

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

app.get('/mapping', async (req, res) => {
    res.send(await mappingService.getConfig());
});

app.post('/mapping/:uid', (req, res) => {
    const alertRuleUid: string = req.params.uid;
    const data: MappingData = req.body;

    mappingService.setMapping(alertRuleUid, data);
    res.status(204).send();
});

app.delete('/mapping/:uid', (req, res) => {
    const alertRuleUid: string = req.params.uid;

    mappingService.deleteMapping(alertRuleUid);
    res.status(204).send();
});

logger.info(`listening on port ${port}`);
app.listen(port);
