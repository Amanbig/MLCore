"""add category to files

Revision ID: a1b2c3d4e5f6
Revises: dc4557917e8f
Create Date: 2026-02-22 15:00:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "dc4557917e8f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add category column to files table."""
    op.add_column(
        "files",
        sa.Column("category", sa.String(), nullable=True, server_default="general"),
    )


def downgrade() -> None:
    """Remove category column from files table."""
    op.drop_column("files", "category")
