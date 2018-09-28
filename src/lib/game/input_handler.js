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
    }

    applyInputs() {
        this.inputsToApply.forEach(input => {
            let player = input.player;
            if (player.isDead)
                return;

            switch (input.keyCode) {
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

            this._smoothCorrection(input);

            player.lastProcessedFrame = input.frame;
            player.positionChanged = true;
        });

        this.inputsToApply = [];
    }

    _smoothCorrection(input) {
        let player = input.player;
        let clientPosition = input.position;
        let diffX = Math.abs(player.x - clientPosition.x);
        let diffY = Math.abs(player.y - clientPosition.y);
        if(diffX <= input.player.speed)
            player.x = clientPosition.x;
        if(diffY <= input.player.speed)
            player.y = clientPosition.y;
        player.verticalSpeed = clientPosition.verticalSpeed;
    }
};