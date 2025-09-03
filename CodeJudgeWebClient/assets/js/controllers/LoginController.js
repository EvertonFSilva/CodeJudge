import { LoginModel } from '../models/LoginModel.js';
import { LoginView } from '../views/LoginView.js';
import { SessionManager } from '../utils/SessionManager.js';

export class LoginController {
    constructor() {
        this.loginModel = new LoginModel();
        this.loginView = new LoginView('loginForm', 'loginMessage');
        this.loginView.bindSubmit(this.handleLogin.bind(this));
    }

    async handleLogin(username, password) {
        try {
            const result = await this.loginModel.login(username, password);

            if (result.success) {
                SessionManager.setSession(result.authToken, 60);
                window.location.href = 'index.html';
            } else {
                this.loginView.showMessage(result.message);
            }
        } catch (err) {
            this.loginView.showMessage('Erro de conexão com o servidor');
            console.error(err);
        }
    }
}
