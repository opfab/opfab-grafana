import express from 'express';

const app = express();
const port = 2109;

app.use(express.json());

app.post('/alert', (req, res) => {
    console.log(req.body);
    res.send();
});

app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
