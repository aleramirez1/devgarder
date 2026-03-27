const vscode = require('vscode');

const THRESHOLDS  = [200, 500, 900, 1500, Infinity];
const STAGE_NAMES = ['🌱 Semilla', '🌿 Brote', '🪴 Planta Joven', '🌳 Planta Madura', '🌸 Floreciendo'];

const CODE_KEYWORDS = [
    'function','const','let','var','class','import','export','return',
    '=>','if','else','for','while','async','await','def','print',
    'public','private','void','int','string','bool','type','interface'
];

class PlantController {
    constructor(plantModel, storageService) {
        this._model    = plantModel;
        this._storage  = storageService;
        this._provider = null;
        this._lastActive = Date.now();
    }

    setProvider(provider) { this._provider = provider; }

    getPlantData() {
        return {
            linesWritten:    this._model.linesWritten,
            stage:           this._model.stage,
            totalTime:       this._model.totalTime,
            consecutiveDays: this._model.consecutiveDays,
            threshold:       THRESHOLDS[this._model.stage],
            prevThreshold:   this._model.stage > 0 ? THRESHOLDS[this._model.stage - 1] : 0
        };
    }

    loadPlantData() {
        this._storage.clear();   
        this._checkNewDay();
    }

    onWater() {
        this._provider?.wake();
        this._provider?.refresh();
        vscode.window.showInformationMessage('💧 ¡Regaste tu planta!');
    }

    onUserActivity(changes = []) {
        this._lastActive = Date.now();
        let shouldWake = false;

        for (const change of changes) {
            const fullLine = (change.fullLine || '').trim();
            if (this._isRealCode(fullLine)) {
                shouldWake = true;
            }
        }

        if (shouldWake) {
            this._provider?.wake();
        }
    }

    onPaste(lines = []) {
        const realLines = lines.filter(l => this._isRealCode(l.trim()));
        if (realLines.length === 0) return;
        this._lastActive = Date.now();
        this._model.linesWritten += realLines.length;
        this._updateStage();
        this._storage.save(this._model.toJSON());
        this._provider?.sendPoints(realLines.length);
        this._provider?.refresh();
        this._provider?.wake();
    }

    onLineCompleted(lineText) {
        if (this._isRealCode(lineText.trim())) {
            this._model.linesWritten += 1;
            this._updateStage();
            this._storage.save(this._model.toJSON());
            this._provider?.sendPoints(1);
            this._provider?.refresh();
        }
    }

    updatePlantTime() {
        const timeSinceActive = Date.now() - this._lastActive;
        if (timeSinceActive < 5000) {
            this._model.totalTime += 60;
            this._storage.save(this._model.toJSON());
            this._provider?.refresh();
        }
    }

    _isRealCode(text) {
        if (!text || text.trim().length === 0) return false;
        const t = text.trim();
        if (t.startsWith('//') || t.startsWith('#') || t.startsWith('*')) return false; 
        if (CODE_KEYWORDS.some(k => t.includes(k))) return true;
        if (/[(){};=<>!&|+\-*\/]/.test(t)) return true;
        if (t.length >= 5) return true;
        return false;
    }

    _updateStage() {
        const oldStage = this._model.stage;
        for (let i = 0; i < THRESHOLDS.length; i++) {
            if (this._model.linesWritten < THRESHOLDS[i]) {
                this._model.stage = i;
                break;
            }
        }
        if (this._model.stage > oldStage) {
            vscode.window.showInformationMessage(
                ` ¡Tu planta evoluciono a ${STAGE_NAMES[this._model.stage]}!`
            );
        }
    }

    _checkNewDay() {
        const today = new Date().toDateString();
        if (this._model.lastDay !== today) {
            if (this._model.lastDay) {
                const diff = Math.floor((Date.now() - new Date(this._model.lastDay)) / 86400000);
                this._model.consecutiveDays = diff === 1 ? this._model.consecutiveDays + 1 : 1;
            } else {
                this._model.consecutiveDays = 1;
            }
            this._model.lastDay = today;
            this._storage.save(this._model.toJSON());
        }
    }
}

module.exports = PlantController;
