const config = require('../config');
const axios = require('axios');

class LevelEditor {
    getLevels() {
        return axios.get(config.levelEditorUrl + '/levels').then(response => response.data);
    }

    getCharacters() {
        return axios.get(config.levelEditorUrl + '/characters').then(response => response.data);
    }
}

module.exports = new LevelEditor();