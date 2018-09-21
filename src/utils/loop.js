const timeUtils = require('./time');

module.exports = class Loop {
    constructor(func, frameRate) {
        this.startTime = timeUtils.hrtimeMs();
        this.frameRate = frameRate;
        this.func = func;
        this.lastFrame = 0;
    }

    start() {
        let now = timeUtils.hrtimeMs();
        let currentFrame = Math.ceil((now - this.startTime) / this.frameRate);
        let deltaTime = (currentFrame - this.lastFrame) * this.frameRate;

        deltaTime && this.func(deltaTime, currentFrame);

        this.lastFrame = currentFrame;
        setTimeout(() => this.start(), this.frameRate);
    }
};