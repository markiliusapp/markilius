"""
Migration: Drop public_profile_enabled column from users table.

Run from the backend directory:
    python migrations/drop_public_profile_enabled.py
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE users
        DROP COLUMN IF EXISTS public_profile_enabled
    """))
    conn.commit()

print("Migration complete: public_profile_enabled dropped from users.")
