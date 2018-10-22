'use strict';
const express = require('express');
const router = express.Router();
const fs = require('fs');
const https = require('https');
const path = require('path');
const ext = require('commander');
const axios = require('axios');
const jwt = require('express-jwt');
const bodyParser = require('body-parser');
const TwitchUtilities = require('./twitchUtilities');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
ext.
    version(require('../package.json').version).
    option('-s, --secret <secret>', 'Extension secret').
    option('-c, --client-id <client_id>', 'Extension client ID').
    option('-o, --owner-id <owner_id>', 'Extension owner ID').
    option('-l, --local <manifest_file>', 'Developer rig local mode').
    parse(process.argv);

function getOption(optionName, environmentName, localValue) {
    if (ext[optionName]) {
        return ext[optionName];
    } else if (process.env[environmentName]) {
        return process.env[environmentName];
    } else if (ext.local) {
        return localValue;
    }
    process.exit(1);
}
const ownerId = getOption('ownerId', 'ENV_OWNER_ID', '100000001');
const secret = Buffer.from(getOption('secret', 'ENV_SECRET', 'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk'), 'base64');
let clientId;
if (ext.local) {
    console.log("Locating client ID");
    const localFileLocation = path.resolve(process.cwd(), ext.local);
    clientId = require(localFileLocation).clientId;
    console.log(localFileLocation);
    console.log(clientId);
}
clientId = getOption('clientId', 'ENV_CLIENT_ID', clientId);

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
    res.status(200).send({here: 'iam'});
});
app.use(jwt({ secret: Buffer.from(getOption('secret', 'ENV_SECRET', 'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk'), 'base64') }))

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
router.delete('/cta', async (req, res, next) => {
    if (req.user.role === 'broadcaster') {
        try {
            console.log(req.headers.authorization);
            // const payload = TwitchUtilities.verifyAndDecode(secret, req.headers.authorization);
            // const { channel_id: channelId, opaque_user_id: opaqueUserId } = payload;
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
            const apiHost = ext.local ? 'localhost.rig.twitch.tv:3000' : 'api.twitch.tv';
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
router.post('/cta', async (req, res, next) => {
    try {
        console.log(req.headers.authorization);
        // const payload = TwitchUtilities.verifyAndDecode(secret, req.headers.authorization);
        // const { channel_id: channelId, opaque_user_id: opaqueUserId } = payload;
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
            message: req.body.message,
            targets: ['broadcast'],
        });

        // Send the broadcast request to the Twitch API.
        const apiHost = ext.local ? 'localhost.rig.twitch.tv:3000' : 'api.twitch.tv';
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
});
app.use('/', router);

let options = {
    key: fs.readFileSync(path.resolve(__dirname, '../conf/server.key')),
    cert: fs.readFileSync(path.resolve(__dirname, '../conf/server.crt')),
};

const PORT = 8081;
https.createServer(options, app).listen(PORT, function () {
    console.log('Extension Boilerplate service running on https', PORT);
});