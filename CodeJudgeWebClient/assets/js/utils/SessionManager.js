export class SessionManager {
    static setSession(token, durationMinutes = 30) {
        const now = new Date().getTime();
        const expireTime = now + durationMinutes * 60 * 1000;
        localStorage.setItem('authToken', token);
        localStorage.setItem('authTokenExpire', expireTime);
    }

    static isSessionValid() {
        const token = localStorage.getItem('authToken');
        const expireTime = localStorage.getItem('authTokenExpire');
        if (!token || !expireTime) return false;
        return new Date().getTime() <= parseInt(expireTime);
    }

    static clearSession() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authTokenExpire');
    }

    static checkSessionAndRedirect() {
        if (!this.isSessionValid()) {
            this.clearSession();
            alert('Sua sessão expirou!');
            window.location.href = 'login.html';
        }
    }

    static getToken() {
        return this.isSessionValid() ? localStorage.getItem('authToken') : null;
    }
}