class StorageService {
    constructor(context) {
        this.context = context;
    }

    save(key, data) {
        return this.context.globalState.update(key, data);
    }

    load(key) {
        return this.context.globalState.get(key);
    }
}

module.exports = StorageService;
