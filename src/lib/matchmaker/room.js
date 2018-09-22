const config = require('../../config');
const Game = require('../game');
const _ = require('lodash');

module.exports = class Room {
    constructor(level, characters) {
        this._level = level;
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

        this._assignSlotAndTeam(client);
        this._assignCharacter(client);
        this._clients.push(client);

        console.log(`Client "${client.name}" joined the room at slot ${client.slot}`);

        this._extendTimeout();
        this._syncClients();
    }

    isAvailable() {
        return this._clients.length < this._level.spawnPoints.length && this._isAvailable;
    }

    _syncClients(messageType) {
        let room = this.toObject();
        this._clients.forEach(client => {
            let clonedRoom = _.cloneDeep(room);
            clonedRoom.clients.forEach(roomClient => {
                roomClient.isLocal = roomClient.id === client.id;
            });

            client.send(messageType || 'ROOM', clonedRoom);
        });
    }

    isEmpty() {
        return !this._clients.length;
    }

    toObject() {
        return _.cloneDeep({
            level: this._level,
            clients: this._clients.map(client => client.toObject()),
            roomTimeout: this._roomTimeout
        });
    }

    _assignSlotAndTeam(client) {
        if (this._level.teams.length) {
            let smallestTeam = this._getSmallestTeam();
            client.team = smallestTeam;
            for (let slot = 1; slot <= this._level.spawnPoints.length; slot++) {
                let spawnPoint = this._level.spawnPoints[slot - 1];
                let isSlotAvailable = !this._clients.find(client => client.slot === slot);
                if(spawnPoint.team === smallestTeam && isSlotAvailable) {
                    client.slot = slot;
                    break;
                }
            }
        } else {
            let availableSlots = [];
            for (let slot = 1; slot <= this._level.spawnPoints.length; slot++) {
                let isSlotAvailable = !this._clients.find(client => client.slot === slot);
                isSlotAvailable && availableSlots.push(slot);
            }

            client.slot = _.sample(availableSlots);
        }
    }

    _assignCharacter(client) {
        if (client.team) {
            client.character = this._characters.find(character => character.team === client.team);
        } else {
            let otherClients = this._clients.filter(otherClient => otherClient.id !== client.id);
            let usedCharacterIds = otherClients.map(otherClient => otherClient.character._id);
            let availableCharacters = this._characters.filter(character => {
                return usedCharacterIds.indexOf(character._id) === -1;
            });

            client.character = _.sample(availableCharacters);
        }
    }

    removeClient(client) {
        if (this._gameStarted)
            return;

        this._clients = this._clients.filter(roomClient => roomClient.id !== client.id);
        this._extendTimeout();
        this._syncClients();
    }

    _extendTimeout() {
        clearTimeout(this._timeout);
        if (this._clients.length >= this._level.minPlayers)
            this._timeout = setTimeout(() => this._prepareClients(), config.roomTimeout);
    }

    _prepareClients() {
        console.log('Making sure all clients are ready');

        this._isAvailable = false;
        this._syncClients('PREPARE');

        this._clients.forEach(client => {
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

    _getSmallestTeam() {
        let slotsByTeam = this._getSlotsByTeam();
        let smallestTeam = null;
        this._level.teams.forEach(team => {
            if(!smallestTeam)
                smallestTeam = team;
            else if(slotsByTeam[team].length < slotsByTeam[smallestTeam].length) {
                smallestTeam = team;
            }
        });

        return smallestTeam || _.sample(this._level.teams);
    }

    _getSlotsByTeam() {
        let slotsByTeam = {};
        this._level.teams.forEach(team => {
            slotsByTeam[team] = this._clients.filter(client => client.team === team).map(client => client.slot);
        });
        return slotsByTeam;
    }
};