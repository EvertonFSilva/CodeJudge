from pydantic import BaseModel

class LoginResponse(BaseModel):
    success: bool
    message: str
    authToken: str = ""
    profile: dict = {}
