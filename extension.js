const vscode = require('vscode');
const PlantModel = require('./src/models/PlantModel');
const StorageService = require('./src/services/StorageService');
const ActivityService = require('./src/services/ActivityService');
const PlantController = require('./src/controllers/PlantController');
const PlantViewProvider = require('./src/views/PlantViewProvider');
const AuthService = require('./src/services/AuthService');
const AuthViewProvider = require('./src/views/AuthViewProvider');
const SettingsViewProvider = require('./src/views/SettingsViewProvider');

function activate(context) {
    console.log('CODE GARDEN ACTIVADO');

    const authService = new AuthService(context);

    // Verificar autenticación antes de activar la extensión
    checkAuthAndActivate(context, authService);
}

async function checkAuthAndActivate(context, authService) {
    try {
        const isAuth = await authService.isAuthenticated();

        if (!isAuth) {
            const authView = new AuthViewProvider(context, authService, () => {
                vscode.window.showInformationMessage('🌿 ¡Bienvenido a Code Garden!');
                activateExtension(context, authService);
            });
            authView.show();
            return;
        }

        activateExtension(context, authService);
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        // Si algo falla, mostrar login en lugar de quedarse colgado
        const authView = new AuthViewProvider(context, authService, () => {
            vscode.window.showInformationMessage('🌿 ¡Bienvenido a Code Garden!');
            activateExtension(context, authService);
        });
        authView.show();
    }
}

function activateExtension(context, authService) {
    const plantModel = new PlantModel();
    const storageService = new StorageService(context);
    const controller = new PlantController(plantModel, storageService);

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
        // Comando de configuración
    const settingsCommand = vscode.commands.registerCommand('code-garden.settings', () => {
        const settings = new SettingsViewProvider(context, authService);
        settings.show();
    });
    context.subscriptions.push(settingsCommand);
        vscode.window.showInformationMessage(`🌱 Etapa ${plantModel.stage} - ${Math.floor(plantModel.growth)} puntos`);
    });

    context.subscriptions.push(disposable);

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document.uri.scheme === 'output') return;
            if (e.contentChanges.length === 0) return;

            const activityChanges = [];

            for (const change of e.contentChanges) {
                const inserted = change.text;
                const lineNumber = change.range.start.line;

                if (inserted.startsWith('\n') || inserted.startsWith('\r\n')) {
                    const completedLine = e.document.lineAt(lineNumber).text.trim();
                    if (completedLine) {
                        controller.onLineCompleted(completedLine);
                    }
                    continue;
                }

                if (inserted.includes('\n')) {
                    const rawLines = inserted.split('\n');
                    const completedPastedLines = rawLines.slice(0, -1).map(l => l.trim());
                    controller.onPaste(completedPastedLines);
                    const lastLine = rawLines[rawLines.length - 1].trim();
                    if (lastLine) {
                        activityChanges.push({ text: lastLine, fullLine: lastLine });
                    }
                    continue;
                }

                let fullLine = '';
                try { fullLine = e.document.lineAt(lineNumber).text.trim(); } catch(_) {}
                activityChanges.push({ text: inserted, fullLine });
            }

            if (activityChanges.length > 0) {
                controller.onUserActivity(activityChanges);
            }
        })
    );

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => {
            controller.onUserActivity([]);
        })
    );

    setInterval(() => controller.updatePlantTime(), 60000);

    vscode.window.showInformationMessage('🌱 Code Garden activo');
}

function deactivate() {}

module.exports = { activate, deactivate };
