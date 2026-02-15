import uuid
from sqlalchemy import JSON, UUID, Float, String
from sqlalchemy.orm import Mapped, mapped_column
from src.common.db.base import Base
from src.common.db.tables import Tables


class MLModel(Base):
    __tablename__ = Tables.MODELS

    id: Mapped = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name: Mapped = mapped_column(String, default=None)

    version: Mapped = mapped_column(String, default=None)

    description: Mapped = mapped_column(String, default=None)
    
    location: Mapped = mapped_column(String, default=None)
    
    model_type:Mapped = mapped_column(String, default=None)
    
    inputs:Mapped = mapped_column(JSON, default=None)
    
    outputs:Mapped = mapped_column(JSON, default=None)
    
    accuracy:Mapped = mapped_column(Float,default=0.0)
    
    error:Mapped = mapped_column(Float, default=0.0)
