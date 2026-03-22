from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, tasks, productivity, arena, public, payments
from app.services.scheduler import scheduler, send_weekly_summaries, send_monthly_summaries


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(send_weekly_summaries, "interval", hours=1, id="weekly_summary")
    scheduler.add_job(send_monthly_summaries, "interval", hours=1, id="monthly_summary")
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="Markilius Backend", lifespan=lifespan)

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
app.include_router(public.router)
app.include_router(payments.router)


@app.get("/")
def root():
    return {"message": "Markilius API is running!"}


@app.get("/health")
def health():
    return {"status": "Healthy"}
