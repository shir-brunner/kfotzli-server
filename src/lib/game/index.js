const config = require('../../config');
const Loop = require('../../utils/loop');
const Physics = require('../../../../client/src/game/engine/physics');

module.exports = class Game {
    constructor(level, clients) {
        //this.gameState = this._createGameState(level, clients);
        //this.physics = new Physics(this.gameState);
        this.clients = clients;
    }

    _createGameState(level, clients) {
        return new GameState({
            players: clients.map((client, index) => {
                let spawnPoint = level.spawnPoints[index];
                let playerParams = client.character;
                playerParams.x = spawnPoint.x;
                playerParams.y = spawnPoint.y - client.character.height + config.squareSize;
                _.assign(playerParams, _.omit(client, ['name']));
                return new Player(playerParams);
            }),
            gameObjects: level.gameObjects.map(gameObject => new GameObject(gameObject))
        });
    }

    start() {
        this.clients.forEach(client => client.on('close', () => this._removeClient(client)));

        let networkLoop = new Loop(this._networkLoop.bind(this), 500);
        let physicsLoop = new Loop(this._physicsLoop.bind(this), 1000 / config.fps);

        networkLoop.start();
        physicsLoop.start();
    }

    _networkLoop(delta) {
        console.log('network loooping..');
    }

    _physicsLoop(delta) {
        console.log('physics loooping..');
    }

    _removeClient(client) {
        console.log('TODO: remove client ' + client.name);
    }
};