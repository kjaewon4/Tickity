from fastapi import FastAPI
from routers import face

app = FastAPI()
app.include_router(face.router, prefix="/face", tags=["Face API"])
