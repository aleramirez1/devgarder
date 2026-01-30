const vscode = require('vscode');
const PlantModel = require('./src/models/PlantModel');
const StorageService = require('./src/services/StorageService');
const ActivityService = require('./src/services/ActivityService');
const PlantController = require('./src/controllers/PlantController');
const PlantViewProvider = require('./src/views/PlantViewProvider');

function activate(context) {
    console.log('CODE GARDEN ACTIVADO');

    const plantModel = new PlantModel();
    const storageService = new StorageService(context);
    const activityService = new ActivityService();
    const controller = new PlantController(plantModel, storageService, activityService);

    controller.loadPlantData();

    const provider = new PlantViewProvider(context.extensionUri, context, controller);
    controller.setProvider(provider);

    const viewProvider = vscode.window.registerWebviewViewProvider(
        'plantView',
        provider,
        {
            webviewOptions: {
                retainContextWhenHidden: true
            }
        }
    );

    context.subscriptions.push(viewProvider);

    let disposable = vscode.commands.registerCommand('code-garden.showPlant', function () {
        vscode.window.showInformationMessage(`🌱 Etapa ${plantModel.stage} - ${Math.floor(plantModel.growth)} puntos`);
    });

    context.subscriptions.push(disposable);

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.contentChanges.length > 0) {
                const hasRealCode = e.contentChanges.some(change => {
                    const text = change.text.trim();
                    return text.length > 0 && !activityService.isOnlyWhitespace(change.text);
                });

                if (hasRealCode) {
                    controller.onUserActivity(e.contentChanges);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => {
            controller.onUserActivity();
        })
    );

    setInterval(() => {
        controller.updatePlantGrowth();
    }, 60000);

    vscode.window.showInformationMessage('🌱 Code Garden activo');
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
