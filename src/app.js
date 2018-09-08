const WebSocketServer = require('websocket').server;
const http = require('http');
const config = require('./config');
const reception = require('./lib/matchmaker/reception');
const Client = require('./lib/matchmaker/client');
const _ = require('lodash');
const moment = require('moment');
const chalk = require('chalk');

let httpServer = http.createServer((request, response) => {
});
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

console.logCopy = console.log.bind(console);
console.log = function () {
    arguments[0] = chalk.blue(arguments[0]);
    arguments[1] = chalk.magenta(arguments[1]);
    this.logCopy(moment().format('YYYY-MM-DD HH:mm:ss') + ':', ...arguments);
};