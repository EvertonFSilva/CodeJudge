"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageRegistry = void 0;
class LanguageRegistry {
    languages = new Map();
    constructor() { }
    register(def) {
        this.languages.set(def.id.toLowerCase(), def);
    }
    updateFromApi(apiLanguages) {
        for (const lang of apiLanguages) {
            const ext = lang.sourceExtension.startsWith('.')
                ? lang.sourceExtension.toLowerCase()
                : `.${lang.sourceExtension.toLowerCase()}`;
            const extensions = [ext];
            if (lang.key.toLowerCase() === 'c' && !extensions.includes('.h')) {
                extensions.push('.h');
            }
            if (lang.key.toLowerCase() === 'cpp') {
                ['.cc', '.cxx', '.hpp', '.h'].forEach(e => {
                    if (!extensions.includes(e)) {
                        extensions.push(e);
                    }
                });
            }
            this.register({
                id: lang.key,
                name: lang.name,
                extensions,
                compiler: lang.needsCompilation ? lang.key : undefined
            });
        }
    }
    getById(id) {
        if (!id) {
            return undefined;
        }
        const lower = id.toLowerCase().trim();
        const direct = this.languages.get(lower);
        if (direct) {
            return direct;
        }
        for (const def of this.languages.values()) {
            if (def.name.toLowerCase() === lower) {
                return def;
            }
            if (def.id === 'cpp' && (lower === 'c++' || lower === 'cpp')) {
                return def;
            }
            if (def.id === 'python' && (lower === 'py' || lower === 'python3' || lower === 'python')) {
                return def;
            }
        }
        return undefined;
    }
    getByFileName(fileName) {
        if (!fileName) {
            return undefined;
        }
        const lower = fileName.toLowerCase().trim();
        for (const def of this.languages.values()) {
            for (const ext of def.extensions) {
                if (lower.endsWith(ext.toLowerCase())) {
                    return def;
                }
            }
        }
        return undefined;
    }
    isSupported(idOrFileName) {
        return Boolean(this.getById(idOrFileName) || this.getByFileName(idOrFileName));
    }
    getAll() {
        return Array.from(this.languages.values());
    }
    getFormattedSupportedList() {
        return this.getAll()
            .map(l => `${l.name} (${l.extensions.join(', ')})`)
            .join(', ');
    }
}
exports.LanguageRegistry = LanguageRegistry;
//# sourceMappingURL=LanguageRegistry.js.map