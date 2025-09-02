from pydantic import BaseModel

class ProfileResponse(BaseModel):
    success: bool
    message: str
    profile: dict = {}