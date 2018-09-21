const LEFT_KEY = 37;
const RIGHT_KEY = 39;
const UP_KEY = 38;
const DOWN_KEY = 40;

module.exports = class InputHandler {
    constructor(world) {
        this.world = world;
        this.inputsToApply = [];
    }

    handle(input, client) {
        let player = this.world.players.find(player => player.id === client.id);
        input.player = player;
        this.inputsToApply.push(input);
        console.log('RECEIVED INPUT FOR CLIENT FRAME = ' + input.frame + ' WHICH IS ' + (input.isPressed ? 'KEY DOWN' : 'KEY UP'));
    }

    applyInputs() {
        this.inputsToApply.forEach(input => {
            console.log('APPLYING INPUT FOR CLIENT FRAME = ' + input.frame + ' WHICH IS ' + (input.isPressed ? 'KEY DOWN' : 'KEY UP'));
            let player = input.player;
            if (player.isDead)
                return;

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
        });

        this.inputsToApply = [];
    }
};