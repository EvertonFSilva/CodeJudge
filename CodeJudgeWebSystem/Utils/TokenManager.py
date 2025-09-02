import random
import string

class TokenManager:
    _sessions = {}

    @classmethod
    def generateToken(cls):
        return ''.join(random.choices(string.ascii_letters + string.digits, k=32))

    @classmethod
    def createSession(cls, login, password, profileData):
        token = cls.generateToken()
        cls._sessions[token] = {"login": login, "password": password, "profile": profileData}
        return token

    @classmethod
    def getSession(cls, token):
        return cls._sessions.get(token)

    @classmethod
    def removeSession(cls, token):
        if token in cls._sessions:
            del cls._sessions[token]

    @classmethod
    def findSessionByCredentials(cls, login, password):
        for token, session in cls._sessions.items():
            if session["login"] == login and session["password"] == password:
                return token, session
        return None, None
