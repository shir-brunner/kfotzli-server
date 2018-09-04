const _ = require('lodash');
const uuid = require('uuid');

module.exports = class Client {
    constructor(connection) {
        this._connection = connection;
        this.id = uuid();
        this.name = null;
        this.character = null;
        this.slot = null;
    }

    on(eventName, callback) {
        if(eventName === 'message') {
            this._connection.on('message', message => callback(JSON.parse(message.utf8Data)));
        } else {
            this._connection.on(eventName, callback);
        }
    }

    send(messageType, data) {
        this._connection.send(JSON.stringify({
            type: messageType,
            body: data
        }));
    }

    toObject() {
        return _.pick(this, ['id', 'name', 'character', 'slot']);
    }
};