const config = require('../../config');
const Loop = require('../../utils/loop');
const GameState = require('../../../../client/src/game/engine/game_state');
const Physics = require('../../../../client/src/game/engine/physics');
const InputHandler = require('./input_handler');
const _ = require('lodash');
const FRAME_RATE = Math.round(1000 / config.fps);

module.exports = class Game {
    constructor(level, clients) {
        this.gameState = GameState.create(level, clients.map(client => client.toObject()));
        this.physics = new Physics(this.gameState);
        this.inputHandler = new InputHandler(this.gameState);
        this.clients = clients;
        this.gameTime = 0;
        this.startTime = Date.now();
    }

    start() {
        this.clients.forEach(client => {
            client.on('message.INPUT', input => this.inputHandler.handle(input, client));
            client.on('close', () => this._removeClient(client));
        });

        let physicsLoop = new Loop(this._physicsLoop.bind(this), FRAME_RATE);
        physicsLoop.start();
    }

    _physicsLoop(deltaTime) {
        let deltaFrames = deltaTime / FRAME_RATE;
        while (deltaFrames > 0) {
            if (deltaFrames >= 1) {
                this.gameTime += FRAME_RATE;
                this.physics.update(1, this.gameTime);
            } else {
                this.gameTime += deltaFrames * FRAME_RATE;
                this.physics.update(deltaFrames, this.gameTime);
            }
            deltaFrames--;
        }

        this._networkLoop();
    }

    _networkLoop() {
        if (this.inputHandler.hasChanged) {
            let sharedState = this.gameState.getSharedState(this.gameTime);
            sharedState.gameTime = Date.now() - this.startTime;
            this.clients.forEach(client => client.send('SHARED_STATE', sharedState));
            this.inputHandler.hasChanged = false;
        }
    }

    _removeClient(client) {
        console.log('TODO: remove client "' + client.name + '" from game because he left');
    }
};