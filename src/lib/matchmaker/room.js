const _ = require('lodash');
const config = require('../../config');

module.exports = class Room {
    constructor(level, characters) {
        this._level = level;
        this._maxPlayers = level.spawnPoints.length;
        this._clients = [];
        this._characters = characters;
        this._timeout = null;
        this._roomTimeout = config.roomTimeout;
    }

    addClient(client) {
        if (!this.isAvailable())
            throw new Error('Cannot add client: room is not available');

        this._assignCharacter(client);
        this._assignSlot(client);
        this._clients.push(client);

        console.log(`Client "${client.name}" joined the room at slot ${client.slot}`);

        this._setTimeout();
        this.notifyClients();
    }

    isAvailable() {
        return this._clients.length < this._maxPlayers;
    }

    notifyClients() {
        let room = this.toObject();
        this._clients.forEach(client => {
            room.clients.forEach(roomClient => {
                roomClient.isLocal = roomClient.id === client.id;
            });

            client.send('ROOM', room);
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
        this._clients = this._clients.filter(roomClient => roomClient.id !== client.id);
        this._setTimeout();
        this.notifyClients();
    }

    _setTimeout() {
        clearTimeout(this._timeout);
        if(this._clients.length >= 2)
            this._timeout = setTimeout(this._startGame, config.roomTimeout);
    }

    _startGame() {
        console.log('game should now be started');
    }
};