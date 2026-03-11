from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, tasks, productivity, arena

app = FastAPI(title="Checkly Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # add origin later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
# includes the auth.router routes to your app route tables.
app.include_router(tasks.router)
app.include_router(productivity.router)
app.include_router(arena.router)


@app.get("/")
def root():
    return {"message": "Checkly API is running!"}


@app.get("/health")
def health():
    return {"status": "Healthy"}
