"""add_subscription_cancel_at_to_users

Revision ID: 27f1a55e92ff
Revises: bc9e7adf3b5b
Create Date: 2026-03-25 18:53:25.634333+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '27f1a55e92ff'
down_revision: Union[str, None] = 'bc9e7adf3b5b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('subscription_cancel_at', sa.TIMESTAMP(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'subscription_cancel_at')
