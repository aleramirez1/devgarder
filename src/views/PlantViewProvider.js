const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

class PlantViewProvider {
    constructor(extensionUri, context, controller) {
        this._extensionUri = extensionUri;
        this._context = context;
        this._controller = controller;
        this._view = null;
    }

    get view() { return this._view; }

    resolveWebviewView(webviewView, _ctx, _token) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._loadHtml();

        webviewView.webview.onDidReceiveMessage(msg => {
            if (msg.type === 'water') {
                this._controller.onWater();
            }
            if (msg.type === 'ready') {
                this.refresh();
            }
            if (msg.type === 'openPlant') {
                this._openPlantPanel(msg.plant);
            }
        });

        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                console.log(' Vista visible, refrescando...');
                this.refresh();
            }
        });

        setTimeout(() => this.refresh(), 300);
    }

    refresh() {
        if (!this._view) return;
        this._view.webview.postMessage({
            type: 'update',
            plantData: this._controller.getPlantData()
        });
        this._syncPanels();
    }

    sendPoints(amount) {
        if (!this._view) return;
        this._view.webview.postMessage({ type: 'points', amount: 1 });
    }

    wake() {
        if (!this._view) return;
        this._view.webview.postMessage({ type: 'wake' });
    }

    _openPlantPanel(plantName) {
        const files = {
            cactus: 'plant-cactus.html',
            mushroom: 'plant-mushroom.html',
            bonsai: 'plant-bonsai.html',
            flores1: 'plant-flores1.html',
            flores2: 'plant-flores2.html'
        };
        const file = files[plantName];
        if (!file) return;

        const panel = vscode.window.createWebviewPanel(
            'plantPanel-' + plantName,
            '🌱 Planta misteriosa',   
            vscode.ViewColumn.Beside,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        const htmlPath = path.join(this._extensionUri.fsPath, 'views', file);
        try {
            panel.webview.html = fs.readFileSync(htmlPath, 'utf8');
        } catch (e) {
            panel.webview.html = `<body style="color:red;padding:20px">Error: ${e.message}</body>`;
            return;
        }

        panel.webview.onDidReceiveMessage(msg => {
            if (msg.type === 'ready' || msg.type === 'water') {
                panel.webview.postMessage({
                    type: 'update',
                    plantData: this._controller.getPlantData()
                });
            }
        });

        const syncPanel = () => {
            if (!panel.visible) return;
            panel.webview.postMessage({
                type: 'update',
                plantData: this._controller.getPlantData()
            });
        };

        if (!this._panels) this._panels = [];
        this._panels.push({ panel, sync: syncPanel });
        panel.onDidDispose(() => {
            this._panels = this._panels.filter(p => p.panel !== panel);
        });

        setTimeout(() => syncPanel(), 300);
    }

    _syncPanels() {
        if (!this._panels) return;
        this._panels.forEach(p => p.sync());
    }

    _loadHtml() {
        const htmlPath = path.join(this._extensionUri.fsPath, 'views', 'plant-view.html');
        try {
            return fs.readFileSync(htmlPath, 'utf8');
        } catch (e) {
            return `<body style="color:red;padding:20px">Error cargando vista: ${e.message}</body>`;
        }
    }
}

module.exports = PlantViewProvider;
