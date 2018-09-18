const commonConfig = require('../../../../client/src/game/common_config');
const Loop = require('../../utils/loop');
const World = require('../../../../client/src/game/engine/world');
const Physics = require('../../../../client/src/game/engine/physics');
const InputHandler = require('./input_handler');
const _ = require('lodash');
const FRAME_RATE = Math.round(1000 / commonConfig.fps);
const timeUtils = require('../../utils/time');

module.exports = class Game {
    constructor(level, clients) {
        this.world = World.create(level, clients.map(client => client.toObject()));
        this.inputHandler = new InputHandler(this.world);
        this.clients = clients;
    }

    start() {
        this.clients.forEach(client => {
            client.on('message.INPUT', input => this.inputHandler.handle(input, client));
            client.on('close', () => this._removeClient(client));
        });

        let networkLoop = new Loop(this._networkLoop.bind(this), 1);
        networkLoop.start();

        let physicsLoop = new Loop(this._physicsLoop.bind(this), FRAME_RATE);
        physicsLoop.start();
    }

    _physicsLoop(deltaTime) {
        let deltaFrames = deltaTime / FRAME_RATE;
        for (let frame = 1; frame <= deltaFrames; frame++)
            this.world.physics.update(1);
    }

    _networkLoop() {
        let shouldUpdate = this.world.players.filter(player => player.positionChanged).length;
        if (!shouldUpdate)
            return;

        let sharedState = { players: this.world.players.map(player => player.getSharedState()) };

        this.clients.forEach(client => client.send('SHARED_STATE', sharedState));
        this.world.players.forEach(player => player.positionChanged = false);
    }

    _removeClient(client) {
        console.log('TODO: remove client "' + client.name + '" from game because he left');
    }
};