const commonConfig = require('../../../../client/src/game/common_config');
const Loop = require('../../utils/loop');
const World = require('../../../../client/src/game/engine/world');
const InputHandler = require('./input_handler');
const EventsProcessor = require('../../../../client/src/game/engine/events/events_processor');
const GameplayFactory = require('../../../../client/src/game/gameplay/gameplay_factory');
const _ = require('lodash');
const FRAME_RATE = Math.round(1000 / commonConfig.fps);

module.exports = class Game {
    constructor(level, clients) {
        this.world = World.create(level, clients.map(client => client.toObject()));
        this.inputHandler = new InputHandler(this.world);
        this.eventsProcessor = new EventsProcessor(this.world);
        this.gameplay = (new GameplayFactory()).getGameplay(this.world);
        this.clients = clients;
    }

    start() {
        this.clients.forEach(client => {
            client.on('message.INPUT', input => this.inputHandler.handle(input, client));
            client.on('close', () => this._onClientLeft(client));
        });

        this.loop = new Loop(this._loop.bind(this), FRAME_RATE);
        this.loop.start();
    }

    _loop(deltaTime, currentFrame) {
        let deltaFrames = deltaTime / FRAME_RATE;
        for (let frame = deltaFrames; frame >= 1; frame--) {
            this._update(currentFrame - frame);
        }
    }

    _update(currentFrame) {
        this.inputHandler.applyInputs();
        this.world.update(1, currentFrame);
        this._sendSharedStateIfChanged();
        let events = this.world.worldEvents.collectEvents();
        if (events.length) {
            this.eventsProcessor.process(events);
            this.gameplay.update(events);
            this.clients.forEach(client => client.send('EVENTS', events));
            this._sendSharedState();
        }
    }

    _sendSharedStateIfChanged() {
        let shouldSend = this.world.players.filter(player => player.positionChanged).length;
        if (!shouldSend)
            return;

        this._sendSharedState();
        this.world.players.forEach(player => player.positionChanged = false);
    }

    _sendSharedState() {
        let sharedState = { players: this.world.players.map(player => player.getSharedState()) };
        this.clients.forEach(client => client.send('SHARED_STATE', sharedState));
    }

    _onClientLeft(clientToRemove) {
        this.clients = this.clients.filter(client => client.id !== clientToRemove.id);
        this.world.worldEvents.addEvent('PLAYER_LEFT', { playerId: clientToRemove.id });

        if(!this.clients.length) {
            console.log('Game has been stopped because all clients left');
            this.loop.stop();
        }
    }
};