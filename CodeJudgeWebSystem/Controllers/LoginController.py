from Services.LoginService import LoginService
from Presentation.Schemas.Results.LoginResult import LoginResult

class LoginController:
    def __init__(self):
        self.loginService = LoginService()

    def authenticate(self, request):
        return self.loginService.authenticate(request.username, request.password)