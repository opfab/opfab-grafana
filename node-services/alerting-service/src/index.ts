import express from 'express';
import {getLogger} from './common/logger';
import AlertService from './alertService';

const port = 2109;
const app = express();
const logger = getLogger();
const alertService = new AlertService();

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
