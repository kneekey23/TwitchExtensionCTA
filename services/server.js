'use strict';
const express = require('express');
const router = express.Router();
const fs = require('fs');
const https = require('https');
const path = require('path');
const axios = require('axios');
const jwt = require('express-jwt');
const bodyParser = require('body-parser');
const TwitchUtilities = require('./twitchUtilities');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const ownerId = process.env.ENV_OWNER_ID || '100000001';
const secret = Buffer.from(process.env.ENV_SECRET || 'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk', 'base64');
const clientId = process.env.ENV_CLIENT_ID || 'UzAn5EF5Ub2bUB4BHPyEUduM2G1Tt8';
const isLocal = process.env.ENV_IS_REMOTE || true;
const apiHost = isLocal ? 'localhost.rig.twitch.tv:3000' : 'api.twitch.tv';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use((req, res, next) => {
    console.log('Got request', req.path, req.method);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, DELETE');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return next();
});

router.get('/heartbeat', (req, res, next) => {
    res.status(200).send({ here: 'iam' });
});

// Auth protected routes
router.use(jwt({ secret }))

router.get('/', (req, res, next) => {
    console.log(req.headers);
    console.log(req.user);
    console.log("Got to GET");
    res.status(200).send({ you: "got it dude." })
});

router.get('/link', (req, res, next) => {
    console.log(req.connection.remoteAddress);
    console.log(req.query.userId);
    console.log(req.query.streamId);
    console.log(req.query.time);
    res.redirect(req.query.url);
});

router.get('/whoami', (req, res, next) => {
    console.log(req.headers);
    console.log(req.user);
    console.log("Got to GET");
    res.status(200).send({ you: req.user.role })
});

router.post('/cta', async (req, res, next) => {
    try {
        console.log("Got to POST");
        console.log(clientId);
        console.log(req.body.message);
        console.log(req.user);
        const headers = {
            'Client-Id': clientId,
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + TwitchUtilities.makeServerToken(req.user.channel_id, ownerId, secret),
        };

        // Create the POST body for the Twitch API request.
        const body = JSON.stringify({
            content_type: 'application/json',
            message: req.body.message,
            targets: ['broadcast'],
        });

        // Send the broadcast request to the Twitch API.
        const pubSubUrl = `https://${apiHost}/extensions/message/${req.user.channel_id}`;
        const response = await axios({
            url: pubSubUrl,
            method: 'POST',
            headers,
            data: body,
        });

        res.status(200).send({ you: "got it dude." })
    } catch (e) {
        console.log(e);
        res.status(500).send(e.message);
    }
});

router.delete('/cta', async (req, res, next) => {
    if (req.user.role === 'broadcaster') {
        try {
            console.log(req.headers.authorization);
            console.log("Got to POST");
            console.log(clientId);
            console.log(req.body);
            console.log(req.user);
            const headers = {
                'Client-Id': clientId,
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + TwitchUtilities.makeServerToken(req.user.channel_id, ownerId, secret),
            };

            // Create the POST body for the Twitch API request.
            const body = JSON.stringify({
                content_type: 'application/json',
                message: 'rm',
                targets: ['broadcast'],
            });

            // Send the broadcast request to the Twitch API.
            const pubSubUrl = `https://${apiHost}/extensions/message/${req.user.channel_id}`;
            const response = await axios({
                url: pubSubUrl,
                method: 'POST',
                headers,
                data: body,
            });
            console.log(response);
            res.status(200).send({ you: "got it dude." })
        } catch (e) {
            console.log(e);
            res.status(500).send(e.message);
        }
    } else {
        res.send(401);
    }
});

app.use('/', router);

const options = {
    key: fs.readFileSync(path.resolve(__dirname, '../conf/server.key')),
    cert: fs.readFileSync(path.resolve(__dirname, '../conf/server.crt')),
};

const PORT = 8081;
https.createServer(options, app).listen(PORT, function () {
    console.log('Extension Boilerplate service running on https', PORT);
});