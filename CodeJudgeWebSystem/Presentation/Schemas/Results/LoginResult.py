from pydantic import BaseModel

class LoginResult(BaseModel):
    success: bool
    message: str
    authToken: str = ""
    profile: dict = {}
