from pydantic import BaseModel

class ProfileRequest(BaseModel):
    authToken: str