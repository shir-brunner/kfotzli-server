const ms = require('ms');

module.exports = {
    port: 4001,
    levelEditorUrl: 'http://localhost:4000',
    roomTimeout: ms('6 seconds'),
    debug: {
        latency: process.env.DEBUG_LATENCY || 0,
    }
};