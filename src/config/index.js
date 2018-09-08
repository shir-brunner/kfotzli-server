const ms = require('ms');

module.exports = {
    port: 4001,
    levelEditorUrl: 'http://localhost:4000',
    roomTimeout: ms('1 seconds'),
    fps: 30,
    squareSize: 100,
    debug: {
        latency: 100,
        stopGameAfter: ms('10 seconds')
    }
};