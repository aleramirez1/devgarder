class ActivityService {
    isOnlyWhitespace(text) {
        return /^\s*$/.test(text);
    }
}

module.exports = ActivityService;
