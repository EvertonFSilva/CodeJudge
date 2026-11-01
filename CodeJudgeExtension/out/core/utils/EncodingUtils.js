"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixEncoding = fixEncoding;
function fixEncoding(value) {
    if (typeof value === 'string') {
        try {
            if (/[\xC2-\xF4][\x80-\xBF]/.test(value)) {
                return decodeURIComponent(escape(value));
            }
        }
        catch { }
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(fixEncoding);
    }
    if (value !== null && typeof value === 'object') {
        const cleaned = {};
        for (const key of Object.keys(value)) {
            cleaned[key] = fixEncoding(value[key]);
        }
        return cleaned;
    }
    return value;
}
//# sourceMappingURL=EncodingUtils.js.map