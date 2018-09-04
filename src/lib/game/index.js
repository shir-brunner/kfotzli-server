module.exports = class Game {
    constructor(level, clients) {
        this._level = level;
        this._clients = clients;
    }

    start() {
        this._clients.forEach(client => client.send('GAME_STARTED'));
    }
};