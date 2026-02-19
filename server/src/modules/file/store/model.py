import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from src.common.db.base import Base
from src.common.db.tables import Tables


class Files(Base):
    __tablename__ = Tables.FILES

    id: Mapped[uuid.UUID] = mapped_column(Uuid, default=uuid.uuid4, primary_key=True)
    name: Mapped[str] = mapped_column(String, default=None)
    size: Mapped[str] = mapped_column(String, default=None)
    location: Mapped[str] = mapped_column(String, default=None)
    file_type: Mapped[str] = mapped_column(String, default=None)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey(f"{Tables.USERS}.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
