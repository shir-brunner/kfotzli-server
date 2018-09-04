const _ = require('lodash');
const levelEditor = require('../../services/level_editor');
const Room = require('./room');

class Reception {
    constructor() {
        this._rooms = [];
    }

    async findRoom(client) {
        let room = this._rooms.find(room => room.isAvailable());
        if(!room)
            room = await this.createRoom(client);

        room.addClient(client);
        client.on('close', () => {
            console.log(`Client "${client.name}" left the room`);
            room.removeClient(client);
            if(room.isEmpty()) {
                this._rooms = this._rooms.filter(r => r !== room);
                console.log(`Room was empty and has been removed. rooms left: ${this._rooms.length}`);
            }
        });
    }

    async createRoom() {
        let levels = await levelEditor.getLevels();
        let level = _.sample(levels);
        if(!level)
            throw new Error('Cannot create room: no levels found');

        let characters = await levelEditor.getCharacters();
        if(!characters)
            throw new Error('Cannot create room: no characters found');

        let room = new Room(level, characters);
        this._rooms.push(room);
        return room;
    }
}

module.exports = new Reception();