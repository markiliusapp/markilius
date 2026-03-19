"""
Migration: Add weekly_email, timezone, last_weekly_email_sent columns to users table.

Run from the backend directory:
    python migrations/add_weekly_email_fields.py
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS weekly_email BOOLEAN NOT NULL DEFAULT TRUE
    """))
    conn.execute(text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) NOT NULL DEFAULT 'UTC'
    """))
    conn.execute(text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS last_weekly_email_sent TIMESTAMP WITH TIME ZONE
    """))
    conn.commit()

print("Migration complete: weekly_email, timezone, last_weekly_email_sent added to users.")
