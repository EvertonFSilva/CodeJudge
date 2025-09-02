import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Routers.LoginRouter import LoginRouter
from Routers.ProfileRouter import ProfileRouter

app = FastAPI(
    title="CodeJudgeAuth",
    description="API de autenticação de usuários."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(LoginRouter)
app.include_router(ProfileRouter)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
