import { PromptModel } from '../models/PromptModel.js';
import { PromptView } from '../views/PromptView.js';
import { SessionManager } from '../utils/SessionManager.js';

export class PromptController {
    constructor() {
        if (!SessionManager.isSessionValid()) {
            SessionManager.clearSession();
            window.location.href = 'login.html';
            return;
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.style.display = 'inline-block';
            logoutBtn.addEventListener('click', () => {
                SessionManager.clearSession();
                window.location.href = 'login.html';
            });
        }

        this.model = new PromptModel();
        this.view = new PromptView('promptsContainer', 'loadingMessage');
        this.loadPrompts();
    }

    async loadPrompts() {
        try {
            const token = SessionManager.getToken();
            const templates = await this.model.fetchAllPrompts(token);
            this.view.renderPrompts(templates);
        } catch (error) {
            this.view.renderError(`Erro ao carregar prompts: ${error.message}`);
        }
    }
}
