const LEFT_KEY = 37;
const RIGHT_KEY = 39;
const UP_KEY = 38;
const DOWN_KEY = 40;

module.exports = class InputHandler {
    constructor(gameState) {
        this.gameState = gameState;
    }

    handle(input, client) {
        let player = this.gameState.players.find(player => player.id === client.id);

        switch(input.keyCode) {
            case LEFT_KEY:
                player.controller.isLeftPressed = input.isPressed;
                break;
            case RIGHT_KEY:
                player.controller.isRightPressed = input.isPressed;
                break;
            case UP_KEY:
                player.controller.isUpPressed = input.isPressed;
                break;
            case DOWN_KEY:
                player.controller.isDownPressed = input.isPressed;
                break;
        }

        player.lastProcessedFrame = input.frame;
        player.positionChanged = true;
    }
};