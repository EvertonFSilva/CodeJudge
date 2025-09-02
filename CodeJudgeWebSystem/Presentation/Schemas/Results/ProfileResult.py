from pydantic import BaseModel

class ProfileResult(BaseModel):
    success: bool
    message: str
    profile: dict = {}
