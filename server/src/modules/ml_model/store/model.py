import uuid
from sqlalchemy import UUID, String
from sqlalchemy.orm import Mapped, mapped_column
from src.common.db.base import Base
from src.common.db.tables import Tables


class MLModel(Base):
    __tablename__ = Tables.MODELS

    id: Mapped = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name: Mapped = mapped_column(String, default=None)

    version: Mapped = mapped_column(String, default=None)

    description: Mapped = mapped_column(String, default=None)
