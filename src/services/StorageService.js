class StorageService {
    constructor(context) {
        this._context = context;
    }

    save(data) {
        this._context.globalState.update('plantData', data);
    }

    load() {
        return null; 
    }

    clear() {
        this._context.globalState.update('plantData', undefined);
    }
}

module.exports = StorageService;
