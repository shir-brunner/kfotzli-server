const hrtimeMs = function() {
    let time = process.hrtime();
    return time[0] * 1000 + time[1] / 1000000
};

module.exports = class Loop {
    constructor(func, interval) {
        this._tick = 0;
        this._previous = hrtimeMs();
        this._interval = interval;
        this.func = func;
    }

    start() {
        setTimeout(() => this.start(), this._interval);
        let now = hrtimeMs();
        let delta = now - this._previous;
        this.func(delta / this._interval);
        this._previous = now;
        this._tick++;
    }
};