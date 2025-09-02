import { SessionManager } from '../utils/SessionManager.js';

export class ProfileModel {
    constructor(apiUrl = 'http://localhost:5000/auth/profile') {
        this.apiUrl = apiUrl;
    }

    async fetchProfile() {
        const token = SessionManager.getToken();
        if (!token) throw new Error('Usuário não logado');

        const response = await fetch(this.apiUrl, {
            headers: {
                'x-auth-token': token,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erro ao buscar perfil');
        }

        const data = await response.json();
        return data.profile;
    }
}