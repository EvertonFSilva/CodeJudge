export class LoginView {
    constructor(formId, messageId) {
        this.form = document.getElementById(formId);
        this.message = document.getElementById(messageId);
    }

    bindSubmit(handler) {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            this.clearMessage();
            await handler(username, password);
        });
    }

    showMessage(msg) {
        this.message.textContent = msg;
    }

    clearMessage() {
        this.message.textContent = '';
    }
}