export class LoginModel {
    constructor(apiUrl = 'http://localhost:5000/auth/login') {
        this.apiUrl = apiUrl;
    }

    async login(username, password) {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, message: errorData.messages };
        }

        return await response.json();
    }
}
