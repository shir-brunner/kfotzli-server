const timeUtils = require('./time');

module.exports = class Loop {
    constructor(func, frameRate) {
        this.lastTimestamp = timeUtils.hrtimeMs();
        this.frameRate = frameRate;
        this.func = func;
        this.lastFrame = 0;
    }

    start() {
        let now = timeUtils.hrtimeMs();
        this.lastTimestamp = this.lastTimestamp || now;
        let currentFrame = Math.round((now - this.lastTimestamp) / this.frameRate);
        let deltaTime = (currentFrame - this.lastFrame) * this.frameRate;

        deltaTime && this.func(deltaTime);

        this.lastFrame = currentFrame;
        setTimeout(() => this.start(), this.frameRate);
    }
};