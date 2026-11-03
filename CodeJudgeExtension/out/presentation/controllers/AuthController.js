"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const STORAGE_KEY = 'codejudge.moodleUserProfile';
class AuthController {
    authUseCase;
    globalState;
    constructor(authUseCase, globalState) {
        this.authUseCase = authUseCase;
        this.globalState = globalState;
    }
    getSavedProfile() {
        return this.globalState.get(STORAGE_KEY);
    }
    async login(username, password, courseOverride) {
        const result = await this.authUseCase.authenticate(username, password);
        if (result.success && result.profile) {
            if (courseOverride && courseOverride.trim()) {
                result.profile.course = courseOverride.trim();
            }
            await this.globalState.update(STORAGE_KEY, result.profile);
        }
        return result;
    }
    async updateCourse(course) {
        const current = this.getSavedProfile();
        if (!current)
            return undefined;
        const updated = {
            ...current,
            course
        };
        await this.globalState.update(STORAGE_KEY, updated);
        return updated;
    }
    async logout() {
        await this.globalState.update(STORAGE_KEY, undefined);
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map