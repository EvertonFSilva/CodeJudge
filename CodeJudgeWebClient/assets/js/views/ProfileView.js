export class ProfileView {
    constructor(profileElementId) {
        this.profileElement = document.getElementById(profileElementId);
    }

    renderProfile(profileData) {
        if (this.profileElement) {
            this.profileElement.textContent = `Bem-vindo, ${profileData.name}`;
        }
    }
}