import express from 'express';

const app = express();

app.use(express.json());

app.post('/alert', (req, res) => {
    console.log(req.body);
    res.send();
});

const port = 2109;
console.log(`listening on port ${port}`);
app.listen(port);
