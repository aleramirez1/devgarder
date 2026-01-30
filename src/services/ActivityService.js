class ActivityService {
    constructor() {
        this.activityTimer = null;
        this.isTyping = false;
    }

    detectCodeActivity(changes) {
        let growthAmount = 0.5;

        if (changes && changes.length > 0) {
            changes.forEach(change => {
                const text = change.text;

                if (this.hasKeywords(text)) {
                    growthAmount += 2;
                } else if (text.trim().length > 3) {
                    growthAmount += 1;
                }
            });
        }

        return growthAmount;
    }

    hasKeywords(text) {
        const keywords = ['function', 'const', 'let', 'var', 'class', 'import', 'export', 'return', '=>'];
        return keywords.some(keyword => text.includes(keyword));
    }

    isOnlyWhitespace(text) {
        return /^\s*$/.test(text);
    }

    startActivityTimer(callback) {
        this.isTyping = true;

        if (this.activityTimer) {
            clearTimeout(this.activityTimer);
        }

        this.activityTimer = setTimeout(() => {
            this.isTyping = false;
            callback();
        }, 3000);
    }
}

module.exports = ActivityService;
