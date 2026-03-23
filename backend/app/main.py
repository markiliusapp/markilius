from contextlib import asynccontextmanager
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.limiter import limiter
from app.logger import configure_logging, get_logger
from app.routes import auth, tasks, productivity, arena, public, payments
from app.services.scheduler import scheduler, send_weekly_summaries, send_monthly_summaries

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(send_weekly_summaries, "interval", hours=1, id="weekly_summary")
    scheduler.add_job(send_monthly_summaries, "interval", hours=1, id="monthly_summary")
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="Markilius Backend", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # add origin later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'none'; "
        "object-src 'none';"
    )
    return response


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000)
    logger.info(
        "request",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": duration_ms,
            "ip": request.client.host if request.client else None,
        },
    )
    return response


app.include_router(auth.router)
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
