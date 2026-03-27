class PlantModel {
    constructor() {
        this.linesWritten = 0;  
        this.stage = 0;
        this.totalTime = 0;
        this.consecutiveDays = 0;
        this.lastDay = null;
    }

    toJSON() {
        return {
            linesWritten: this.linesWritten,
            stage: this.stage,
            totalTime: this.totalTime,
            consecutiveDays: this.consecutiveDays,
            lastDay: this.lastDay
        };
    }

    fromJSON(data) {
        this.linesWritten    = data.linesWritten    ?? 0;
        this.stage           = data.stage           ?? 0;
        this.totalTime       = data.totalTime       ?? 0;
        this.consecutiveDays = data.consecutiveDays ?? 0;
        this.lastDay         = data.lastDay         ?? null;
    }
}

module.exports = PlantModel;
