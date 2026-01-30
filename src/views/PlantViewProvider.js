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

    get view() {
        return this._view;
    }

    resolveWebviewView(webviewView, context, token) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        setTimeout(() => {
            webviewView.webview.postMessage({
                type: 'update',
                plantData: this._controller.plantModel.toJSON()
            });
        }, 100);
    }

    _getHtmlForWebview(webview) {
        const htmlPath = path.join(__dirname, '..', '..', 'views', 'plant-view.html');
        let html = fs.readFileSync(htmlPath, 'utf8');
        return html;
    }
}

module.exports = PlantViewProvider;
