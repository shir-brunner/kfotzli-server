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
        this._slots = this._level.spawnPoints.map((spawnPoint, index) => {
            return { team: spawnPoint.team, number: index + 1, takenBy: null };
        });
    }

    addClient(client) {
        if (!this.isAvailable())
            throw new Error('Cannot add client: room is not available');

        this._assignSlotAndTeam(client);
        this._assignCharacter(client);
        this._clients.push(client);

        console.log(`Client "${client.name}" joined the room`);

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
            slots: this._slots,
            roomTimeout: this._roomTimeout
        });
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
        this._clients = this._clients.filter(roomClient => roomClient.id !== client.id);
        this._slots.forEach(slot => {
            if(slot.takenBy === client.id)
                slot.takenBy = null;
        });

        if (this._gameStarted)
            return;

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

    _assignSlotAndTeam(client) {
        if (this._level.teams.length) {
            let smallestTeam = this._getAvailableTeamWithLeastClients();
            let slot = _.sample(this._slots.filter(slot => slot.team === smallestTeam && !slot.takenBy));
            slot.takenBy = client.id;
            client.team = slot.team;
        } else {
            let slot = _.sample(this._slots.filter(slot => !slot.takenBy));
            slot.takenBy = client.id;
        }
    }

    _getAvailableTeamWithLeastClients() {
        let clientsByTeam = this._getClientsByTeam();
        let smallestTeam = null;

        this._level.teams.forEach(team => {
            if (!smallestTeam)
                smallestTeam = team;
            else if (clientsByTeam[team].length < clientsByTeam[smallestTeam].length && this._canJoinTeam(team))
                smallestTeam = team;
        });

        return smallestTeam;
    }

    _canJoinTeam(team) {
        return this._slots.find(slot => slot.team === team && !slot.takenBy);
    }

    _getClientsByTeam() {
        let clientsByTeam = {};
        this._level.teams.forEach(team => {
            clientsByTeam[team] = this._clients.filter(client => client.team === team);
        });
        return clientsByTeam;
    }
};