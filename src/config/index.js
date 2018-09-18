const ms = require('ms');

module.exports = {
    port: 4001,
    levelEditorUrl: 'http://localhost:4000',
    roomTimeout: ms('0.5 seconds'),
    debug: {
        latency: 10,
    }
};