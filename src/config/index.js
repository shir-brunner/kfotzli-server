const ms = require('ms');

module.exports = {
    port: 4001,
    levelEditorUrl: 'http://localhost:4000',
    roomTimeout: ms('1 seconds'),
    fps: 30,
    debug: {
        latency: 1,
    }
};