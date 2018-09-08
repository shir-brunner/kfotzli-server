const _ = require('lodash');
const config = require('../../config');
const Game = require('../game');

module.exports = class Room {
    constructor(level, characters) {
        this._level = level;
        this._maxPlayers = level.spawnPoints.length;
        this._clients = [];
        this._characters = characters;
        this._timeout = null;
        this._roomTimeout = config.roomTimeout;
        this._isAvailable = true;
        this._gameStarted = false;
    }

    addClient(client) {
        if (!this.isAvailable())
            throw new Error('Cannot add client: room is not available');

        this._assignCharacter(client);
        this._assignSlot(client);
        this._clients.push(client);

        console.log(`Client "${client.name}" joined the room at slot ${client.slot}`);

        this._setTimeout();
        this._syncClients();
    }

    isAvailable() {
        return this._clients.length < this._maxPlayers && this._isAvailable;
    }

    _syncClients(messageType) {
        let room = this.toObject();
        this._clients.forEach(client => {
            room.clients.forEach(roomClient => {
                roomClient.isLocal = roomClient.id === client.id;
            });

            client.send(messageType || 'ROOM', room);
        });
    }

    isEmpty() {
        return !this._clients.length;
    }

    toObject() {
        return _.cloneDeep({
            level: this._level,
            maxPlayers: this._maxPlayers,
            clients: this._clients.map(client => client.toObject()),
            roomTimeout: this._roomTimeout
        });
    }

    _assignCharacter(client) {
        let otherClients = this._clients.filter(otherClient => otherClient.id !== client.id);
        let usedCharacterIds = otherClients.map(otherClient => otherClient.character._id);
        let availableCharacters = this._characters.filter(character => {
            return usedCharacterIds.indexOf(character._id) === -1;
        });

        client.character = _.sample(availableCharacters);
    }

    _assignSlot(client) {
        let availableSlots = [];
        for (let slot = 1; slot <= this._maxPlayers; slot++) {
            let isSlotAvailable = !this._clients.find(client => client.slot === slot);
            isSlotAvailable && availableSlots.push(slot);
        }

        client.slot = _.sample(availableSlots);
    }

    removeClient(client) {
        if (this._gameStarted)
            return;

        this._clients = this._clients.filter(roomClient => roomClient.id !== client.id);
        this._setTimeout();
        this._syncClients();
    }

    _setTimeout() {
        clearTimeout(this._timeout);
        if (this._clients.length >= this._level.minPlayers)
            this._timeout = setTimeout(() => this._prepareClients(), config.roomTimeout);
    }

    _prepareClients() {
        console.log('Making sure all clients are ready');

        this._isAvailable = false;
        this._syncClients('PREPARE');

        this._clients.forEach(client => {
            client.on('message.PING', () => client.send('PONG'));
            client.on('message.READY', () => {
                client.isReady = true;
                if (_.every(this._clients, client => client.isReady))
                    this._startGame();
            });
        });
    }

    _startGame() {
        if (this._gameStarted)
            return;

        console.log(`Starting game for clients: ${this._clients.map(client => `"${client.name}"`).join(', ')}`);

        this._gameStarted = true;
        this._syncClients('GAME_STARTED');

        this._clients.forEach(client => client.off());
        let game = new Game(this._level, this._clients);
        game.start();
    }
};