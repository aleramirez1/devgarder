class PlantModel {
    constructor() {
        this.growth = 0;
        this.stage = 0;
        this.lastActive = Date.now();
        this.totalTime = 0;
    }

    updateGrowth(amount) {
        this.growth += amount;
        this.updateStage();
    }

    updateStage() {
        if (this.growth < 20) {
            this.stage = 0;
        } else if (this.growth < 60) {
            this.stage = 1;
        } else if (this.growth < 120) {
            this.stage = 2;
        } else if (this.growth < 200) {
            this.stage = 3;
        } else {
            this.stage = 4;
        }
    }

    toJSON() {
        return {
            growth: this.growth,
            stage: this.stage,
            lastActive: this.lastActive,
            totalTime: this.totalTime
        };
    }

    fromJSON(data) {
        Object.assign(this, data);
    }
}

module.exports = PlantModel;
