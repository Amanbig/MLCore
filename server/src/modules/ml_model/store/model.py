import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from src.common.db.base import Base
from src.common.db.tables import Tables


class MLModel(Base):
    __tablename__ = Tables.MODELS

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, default=None)
    version: Mapped[str] = mapped_column(String, default=None)
    description: Mapped[str] = mapped_column(String, default=None)
    model_type: Mapped[str] = mapped_column(String, default=None)
    inputs: Mapped[dict] = mapped_column(JSON, default=None)
    outputs: Mapped[dict] = mapped_column(JSON, default=None)
    accuracy: Mapped[float] = mapped_column(Float, default=0.0)
    error: Mapped[float] = mapped_column(Float, default=0.0)
    file_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey(f"{Tables.FILES}.id"), nullable=False
    )
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
