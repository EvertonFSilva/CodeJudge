from Utils.TokenManager import TokenManager
from Presentation.Schemas.Results.ProfileResult import ProfileResult

class ProfileController:
    def getProfile(self, authToken):
        session = TokenManager.getSession(authToken)
        if not session:
            return ProfileResult(success=False, message="Token inválido ou expirado", profile={})
        return ProfileResult(success=True, message="Perfil obtido com sucesso", profile=session["profile"])