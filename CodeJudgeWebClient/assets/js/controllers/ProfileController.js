import { ProfileModel } from '../models/ProfileModel.js';
import { ProfileView } from '../views/ProfileView.js';
import { SessionManager } from '../utils/SessionManager.js';

export class ProfileController {
    constructor(profileElementId, logoutBtnId) {
        const logoutBtn = document.getElementById(logoutBtnId);

        this.profileModel = new ProfileModel();
        this.profileView = new ProfileView(profileElementId);
        this.profileData = null;

        if (!SessionManager.isSessionValid()) {
            SessionManager.clearSession();
            window.location.href = 'login.html';
            return;
        }

        this.loadProfile();

        if (logoutBtn) {
            logoutBtn.style.display = 'inline-block';
            logoutBtn.addEventListener('click', () => {
                SessionManager.clearSession();
                window.location.href = 'login.html';
            });
        }
    }

    async loadProfile() {
        try {
            const token = SessionManager.getToken();
            this.profileData = await this.profileModel.fetchProfile(token);
            this.profileView.renderProfile(this.profileData);
        } catch (error) {
            console.error(error.message);
            SessionManager.clearSession();
            window.location.href = 'login.html';
        }
    }

    getUserName() {
        return this.profileData ? this.profileData.name : '';
    }

    getProfile() {
        return this.profileData || {};
    }
}