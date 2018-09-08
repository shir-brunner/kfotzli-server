const config = require('../../config');
const Loop = require('../../utils/loop');
const Physics = require('../../../../client/src/game/engine/physics');
const GameState = require('../../../../client/src/game/engine/game_state');
const _ = require('lodash');
const FRAME_RATE = Math.round(1000 / config.fps);
const chalk = require('chalk');

module.exports = class Game {
    constructor(level, clients) {
        this.gameState = GameState.create(level, clients.map(client => client.toObject()));
        this.physics = new Physics(this.gameState);
        this.clients = clients;
        this.gameTime = 0;
        this.absoluteStartTime = Date.now();
    }

    start() {
        this.clients.forEach(client => client.on('close', () => this._removeClient(client)));

        let networkLoop = new Loop(this._networkLoop.bind(this), config.networkLoopInterval);
        let physicsLoop = new Loop(this._physicsLoop.bind(this), FRAME_RATE);

        networkLoop.start();
        physicsLoop.start();
    }

    _networkLoop() {
        let sharedState = this.gameState.getSharedState(this.gameTime);
        this.clients.forEach(client => client.send('SHARED_STATE', sharedState));
    }

    _physicsLoop(deltaTime) {
        let actualGameTime = Date.now() - this.absoluteStartTime;
        let deltaFrames = deltaTime / FRAME_RATE;
        while (deltaFrames > 0) {
            if (deltaFrames >= 1) {
                this.physics.update(1, this.gameTime);
                this.gameTime += FRAME_RATE;
            } else {
                this.physics.update(deltaFrames, this.gameTime);
                this.gameTime += deltaFrames * FRAME_RATE;
            }
            deltaFrames--;
        }

        if (config.debug.stopGameAfter && actualGameTime >= config.debug.stopGameAfter) {
            console.log(`Game has been stopped for debugging after ${config.debug.stopGameAfter / 1000} seconds`);
            console.log(`actualGameTime: ${actualGameTime}`);
            console.log(`gameTime: ${this.gameTime}`);
            process.exit();
        }
    }

    _removeClient(client) {
        console.log('TODO: remove client "' + client.name + '" from game because he left');
    }
};