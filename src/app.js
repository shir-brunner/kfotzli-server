const WebSocketServer = require('websocket').server;
const http = require('http');
const config = require('./config');
const reception = require('./lib/matchmaker/reception');
const Client = require('./lib/matchmaker/client');
const _ = require('lodash');

let httpServer = http.createServer((request, response) => {});
httpServer.listen(config.port, () => {
    console.log(`KfotzLi socket server is listening on port ${config.port}`);
});

let wsServer = new WebSocketServer({ httpServer: httpServer });
wsServer.on('request', request => {
    let connection = request.accept(null, request.origin);
    let client = new Client(connection);
    client.on('message.CLIENT_DETAILS', message => {
        _.assign(client, _.pick(message.client, ['name']));
        reception.findRoom(client);
    });
});