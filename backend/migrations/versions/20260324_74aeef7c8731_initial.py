"""initial

Revision ID: 74aeef7c8731
Revises:
Create Date: 2026-03-24 00:26:54.273022+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '74aeef7c8731'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('first_name', sa.String(length=50), nullable=False),
        sa.Column('last_name', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('reset_token', sa.String(), nullable=True),
        sa.Column('reset_token_expires', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('verification_token', sa.String(), nullable=True),
        sa.Column('verification_token_expires', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('public_id', sa.String(length=36), nullable=True),
        sa.Column('weekly_email', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('monthly_email', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('timezone', sa.String(length=100), nullable=False, server_default=sa.text("'UTC'")),
        sa.Column('last_weekly_email_sent', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('last_monthly_email_sent', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('subscription_status', sa.String(length=20), nullable=False, server_default=sa.text("'inactive'")),
        sa.Column('subscription_tier', sa.String(length=20), nullable=True),
        sa.Column('stripe_customer_id', sa.String(length=100), nullable=True),
        sa.Column('stripe_subscription_id', sa.String(length=100), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('stripe_customer_id'),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_public_id'), 'users', ['public_id'], unique=True)

    op.create_table(
        'arenas',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('color', sa.String(), nullable=False, server_default=sa.text("'#f97316'")),
        sa.Column('is_archived', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_arenas_id'), 'arenas', ['id'], unique=False)

    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('frequency', sa.String(length=20), nullable=True),
        sa.Column('duration', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_locked', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('group_id', sa.String(), nullable=True),
        sa.Column('arena_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['arena_id'], ['arenas.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_tasks_id'), 'tasks', ['id'], unique=False)
    op.create_index(op.f('ix_tasks_user_id'), 'tasks', ['user_id'], unique=False)
    op.create_index(op.f('ix_tasks_group_id'), 'tasks', ['group_id'], unique=False)
    op.create_index(op.f('ix_tasks_arena_id'), 'tasks', ['arena_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_tasks_arena_id'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_group_id'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_user_id'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_id'), table_name='tasks')
    op.drop_table('tasks')

    op.drop_index(op.f('ix_arenas_id'), table_name='arenas')
    op.drop_table('arenas')

    op.drop_index(op.f('ix_users_public_id'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
