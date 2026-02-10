from sqlalchemy import UUID, String
from sqlalchemy.schema import Column
from src.common.db.base import Base
from src.common.db.tables import Tables

class User(Base):
    __tablename__ = Tables.USERS
    
    id: Column[UUID]
    username: Column[String]
    email: Column[String]
    phone: Column[String]
    
    password_hash: Column[String]