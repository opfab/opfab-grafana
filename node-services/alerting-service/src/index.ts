import express from 'express';
import {getLogger} from './logger';

const app = express();
const logger = getLogger();

app.use(express.json());

app.post('/alert', (req, res) => {
    logger.info(JSON.stringify(req.body));
    res.send();
});

const port = 2109;
logger.info(`listening on port ${port}`);
app.listen(port);
