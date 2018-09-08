const hrtimeMs = function() {
    let time = process.hrtime();
    return time[0] * 1000 + time[1] / 1000000
};

module.exports = class Loop {
    constructor(func, frameRate) {
        this._lastTimestamp = Date.now();
        this._frameRate = frameRate;
        this.func = func;
    }

    start() {
        let now = Date.now();
        let deltaTime = now - this._lastTimestamp;

        if(deltaTime > this._frameRate) {
            this.func(deltaTime);
            this._lastTimestamp = now;
        }

        setTimeout(() => this.start(), this._frameRate);
    }
};