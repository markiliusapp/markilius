from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Checkly Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Local host
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Checkly API is running!"}


@app.get("/health")
def health():
    return {"status": "Healthy"}
