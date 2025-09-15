import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

API_VERSION = "0.1.0"

app = FastAPI(title="TTP Tournaments API", version=API_VERSION)

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True, "version": API_VERSION}
