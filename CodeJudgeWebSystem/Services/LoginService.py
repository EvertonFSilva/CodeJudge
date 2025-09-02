import requests
from bs4 import BeautifulSoup
from Services.ProfileService import ProfileService
from Utils.TokenManager import TokenManager
from Presentation.Schemas.Results.LoginResult import LoginResult

class LoginService:
    def __init__(self):
        self.loginUrl = 'https://ead2.iff.edu.br/login/index.php'
        self.loginSession = requests.Session()
        self.loginSession.headers.update({
            'Origin': 'https://ead2.iff.edu.br',
            'Referer': self.loginUrl,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
        })
        self.profileService = ProfileService()

    def authenticate(self, username, password):
        token, session = TokenManager.findSessionByCredentials(username, password)
        if session:
            return LoginResult(
                success=True,
                message="Sessão já ativa",
                authToken=token,
                profile=session["profile"]
            )

        responseGet = self.loginSession.get(self.loginUrl)
        if responseGet.status_code != 200:
            return LoginResult(success=False, message="Não foi possível fazer login")

        soup = BeautifulSoup(responseGet.text, 'html.parser')
        loginTokenInput = soup.find('input', {'name': 'logintoken'})
        if not loginTokenInput or not loginTokenInput.get("value"):
            return LoginResult(success=False, message="Não foi possível fazer login")

        loginToken = loginTokenInput['value']
        
        loginData = {
            'logintoken': loginToken,
            'username': username,
            'password': password
        }

        responsePost = self.loginSession.post(self.loginUrl, data=loginData)

        if "loginerrormessage" not in responsePost.text:
            profileResponse = self.loginSession.get('https://ead2.iff.edu.br/user/profile.php')
            profileData = self.profileService.gatherProfileData(profileResponse.text)
            authToken = TokenManager.createSession(username, password, profileData)
            return LoginResult(success=True, message="Login realizado com sucesso", authToken=authToken, profile=profileData)

        return LoginResult(success=False, message="Usuário ou senha inválidos")
