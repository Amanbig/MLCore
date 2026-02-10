from os import error
from pydantic.main import BaseModel
from sqlalchemy.orm.session import Session
from typing import Any, Union, Optional, Generic,TypeVar
from sqlalchemy.orm.strategy_options import joinedload

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
        
        if load_relationships:
            for rel in load_relationships:
                if hasattr(self.model,rel):
                    query = query.options(joinedload(getattr(self.model,rel)))
                    
        
        if filters:
            filter_data = (
                filters.model_dump(exclude_unset=True)
                if isinstance(filters,BaseModel)
                else filters
            )
            for field, value in filter_data.items():
                if value is not None and hasattr(self.model,field):
                    query = query.filter(getattr(self.model,field) == value)
        
        return query.all()
        
    
    def create(
        self,
        db:Session,
        obj_in: Any,
        commit: bool = True
    ):
        if isinstance(obj_in,self.model):
            db_obj = obj_in
        elif hasattr(obj_in,"model_dump"):
            db_obj = self.model(**obj_in.model_dump())
        else:
            db_obj = self.model(**obj_in)
        
        
        db.add(db_obj)
        
        try:
            if commit:
                db.commit()
                db.refresh(db_obj)
        except error as e:
            db.rollback()
            print(e)
            
        return db_obj
        
    def update(
        self,
        db:Session,
        db_obj: Any,
        obj_in: Any,
        commit: bool = True
    ):
        if hasattr(obj_in,"model_dump"):
            updated_data = obj_in.model_dump(exclude_unset=True)
        else:
            updated_data = obj_in
        
        for field, value in updated_data.items():
            if hasattr(db_obj,field):
                setattr(db_obj,field, value)
        
        db.add(db_obj)
        
        try:
            db.commit()
            db.refresh(db_obj)
        except error as e:
            db.rollback()
            print(e)
        return db_obj
    
    def get_by_id(
        self,
        db:Session,
        id: Any,
        load_relationships:Optional[list[str]] = None
    ):
        query = db.query(self.model)
        
        if load_relationships:
            for rel in load_relationships:
                if hasattr(self.model, rel):
                    query = query.options(joinedload(getattr(self.model, rel)))
                    
        obj = query.filter(self.model.id == id).first()
        
        if not obj:
            print("Error occured")
        
        return obj
     
    def delete(
        self,
        db:Session,
        id: Any,
    ):
        obj = self.get_by_id(db,id)
        try:
            db.delete(obj)
            db.commit()
        except error as e:
            db.rollback()
            print(e)
        
        return obj