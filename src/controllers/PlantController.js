const vscode = require('vscode');

class PlantController {
    constructor(plantModel, storageService, activityService) {
        this.plantModel = plantModel;
        this.storageService = storageService;
        this.activityService = activityService;
        this.provider = null;
    }

    setProvider(provider) {
        this.provider = provider;
    }

    loadPlantData() {
        const stored = this.storageService.load('plantData');
        if (stored) {
            this.plantModel.fromJSON(stored);
        }
    }

    savePlantData() {
        this.storageService.save('plantData', this.plantModel.toJSON());
    }

    onUserActivity(changes = []) {
        this.plantModel.lastActive = Date.now();

        this.activityService.startActivityTimer(() => {
            this.updatePlantGrowth();
        });

        const growthAmount = this.activityService.detectCodeActivity(changes);
        this.plantModel.updateGrowth(growthAmount);

        this.updatePlantGrowth();
    }

    updatePlantGrowth() {
        const now = Date.now();
        const timeSinceActive = now - this.plantModel.lastActive;

        if (timeSinceActive < 5000) {
            this.plantModel.totalTime += 1;
            this.plantModel.updateGrowth(0.3);
        }

        const oldStage = this.plantModel.stage;
        this.plantModel.updateStage();

        if (oldStage !== this.plantModel.stage) {
            const stageNames = ['🌱 Semilla', '🌿 Brote', '🪴 Planta Joven', '🌳 Planta Madura', '🌸 Floreciendo'];
            vscode.window.showInformationMessage(`${stageNames[this.plantModel.stage]}`);
        }

        this.savePlantData();

        if (this.provider && this.provider.view) {
            this.provider.view.webview.postMessage({
                type: 'update',
                plantData: this.plantModel.toJSON()
            });
        }
    }
}

module.exports = PlantController;
