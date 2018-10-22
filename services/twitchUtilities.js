'use strict';
const jwt = require('jsonwebtoken');

module.exports = {
    makeServerToken(channelId, ownerId, secret, serverTokenDurationSec = 30) {
        const payload = {
            exp: Math.floor(Date.now() / 1000) + serverTokenDurationSec,
            channel_id: channelId,
            user_id: ownerId, // extension owner ID for the call to Twitch PubSub
            role: 'external',
            pubsub_perms: {
                send: ['*'],
            },
        };
        return jwt.sign(payload, secret, { algorithm: 'HS256' });
    },
    verifyAndDecode(secret, header = '') {
        if (header.startsWith('Bearer ')) {
            try {
                console.log(secret);
                const token = header.substring('Bearer '.length);
                console.log(token);
                return jwt.verify(token, secret, { algorithms: ['HS256'] });
            }
            catch (ex) {
            }
        }
        throw new Error("Invalid JWT");
    }
}





