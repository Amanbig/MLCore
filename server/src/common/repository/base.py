from pydantic.main import BaseModel
from sqlalchemy.orm.session import Session
from typing import Union, Optional, Generic,TypeVar

T = TypeVar("T")

class BaseRepository(Generic[T]):
    def __init__(self, model):
        self.model = model
    def get(
        self,
        db: Session,
        filters: Union[BaseModel,dict,None] = None,
        load_relationships:Optional[list[str]] = None
    ):
        query = db.query(self.model)