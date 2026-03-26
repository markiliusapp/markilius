"""add_onboarding_completed_to_users

Revision ID: bc9e7adf3b5b
Revises: 74aeef7c8731
Create Date: 2026-03-25 18:03:18.600733+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bc9e7adf3b5b'
down_revision: Union[str, None] = '74aeef7c8731'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS identity_statement")


def downgrade() -> None:
    op.add_column('users', sa.Column('identity_statement', sa.VARCHAR(length=500), nullable=True))
    op.drop_column('users', 'onboarding_completed')
