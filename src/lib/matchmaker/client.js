const _ = require('lodash');
const uuid = require('uuid');

module.exports = class Client {
    constructor(connection) {
        this.id = uuid();
        this.name = null;
        this.character = null;
        this.slot = null;

        this._connection = connection;
        this._messageHandlers = {};
        this._connection.on('message', params => {
            let message = JSON.parse(params.utf8Data);
            if(this._messageHandlers[message.type])
                this._messageHandlers[message.type](message.body);
        });
    }

    on(eventName, callback) {
        if (_.startsWith(eventName, 'message.'))
            this._messageHandlers[eventName.slice('message.'.length)] = callback;
        else
            this._connection.on(eventName, callback);

        return this;
    }

    off(eventName) {
        if (_.startsWith(eventName, 'message'))
            delete this._messageHandlers[eventName.slice('message.'.length)];

        return this;
    }

    send(messageType, data) {
        this._connection.send(JSON.stringify({
            type: messageType,
            body: data
        }));

        return this;
    }

    toObject() {
        return _.pick(this, ['id', 'name', 'character', 'slot']);
    }
};