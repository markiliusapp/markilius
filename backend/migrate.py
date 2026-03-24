"""
Startup helper: run Alembic migrations with a timeout, then hand off to uvicorn.
uvicorn always starts even if migrations fail — the app stays up for debugging.
"""
import os
import sys
import subprocess

db_url = os.environ.get("DATABASE_URL", "NOT SET")
print(f"DATABASE_URL prefix: {db_url[:30]}...", flush=True)

try:
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        timeout=25,
    )
    if result.returncode == 0:
        print("Migrations applied successfully.", flush=True)
    else:
        print(f"Alembic exited with code {result.returncode}.", flush=True)
except subprocess.TimeoutExpired:
    print("Alembic timed out after 25s — skipping migrations, starting server.", flush=True)
except Exception as e:
    print(f"Migration error: {e}", flush=True)

port = os.environ.get("PORT", "8000")
print(f"Starting uvicorn on port {port}...", flush=True)
os.execv(
    sys.executable,
    [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", port],
)
