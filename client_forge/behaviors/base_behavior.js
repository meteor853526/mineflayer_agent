class BaseBehavior {
    constructor(bot, stateName, targets, complain_duration = 1000 * 5) {
        this.bot = bot;
        this.stateName = stateName;
        this.targets = targets;
        this.active = false;
        this.lastComplain = 0;
        this.complain_duration = complain_duration;
        this.timeout_duration = 1000 * 60;
        this.start_time = 0;
    }

    shouldComplain() {
        const answer = new Date().getTime() - this.lastComplain > this.complain_duration;
        if (answer)
            this.lastComplain = new Date().getTime();
        return answer;
    }

    startJob() {
        this.start_time = new Date().getTime();
    }

    isTimeout() {
        return new Date().getTime() - this.start_time > this.timeout_duration;
    }
}

module.exports = BaseBehavior;