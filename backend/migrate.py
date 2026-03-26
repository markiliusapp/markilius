"""
Startup helper: run Alembic migrations, then start uvicorn.
If migrations fail, the process exits with code 1 — Railway will
abort the deploy and keep the previous working version running.
"""
import os
import sys
import subprocess

db_url = os.environ.get("DATABASE_URL", "NOT SET")
print(f"DATABASE_URL prefix: {db_url[:30]}...", flush=True)

result = subprocess.run(["alembic", "upgrade", "head"], timeout=60)

if result.returncode != 0:
    print(f"Migrations failed (exit code {result.returncode}). Aborting deploy.", flush=True)
    sys.exit(1)

print("Migrations applied successfully.", flush=True)

port = os.environ.get("PORT", "8000")
print(f"Starting uvicorn on port {port}...", flush=True)
os.execv(
    sys.executable,
    [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", port, "--proxy-headers", "--forwarded-allow-ips=*"],
)
