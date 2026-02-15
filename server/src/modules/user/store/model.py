from datetime import datetime, timezone
import uuid
from sqlalchemy import UUID, DateTime, String
from sqlalchemy.orm import Mapped , mapped_column
from src.common.db.base import Base
from src.common.db.tables import Tables

class User(Base):
    __tablename__ = Tables.USERS
    
    id: Mapped[UUID] = mapped_column(
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        )
    username: Mapped[String] = mapped_column(String,default=None)
    email: Mapped[String] = mapped_column(String,default=None)
    phone: Mapped[String] = mapped_column(String,default=None)
    
    password_hash: Mapped[String] = mapped_column(String, default=None)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )