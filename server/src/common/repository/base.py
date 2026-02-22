from typing import Any, Generic, TypeVar, Union

from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

T = TypeVar("T")


class BaseRepository(Generic[T]):
    def __init__(self, model: type[T]):
        self.model = model

    def get(
        self,
        db: Session,
        filters: Union[BaseModel, dict, None] = None,
        load_relationships: list[str] | None = None,
    ) -> list[T]:

        query = db.query(self.model)

        if load_relationships:
            for rel in load_relationships:
                if hasattr(self.model, rel):
                    query = query.options(joinedload(getattr(self.model, rel)))

        if filters:
            filter_data = (
                filters.model_dump(exclude_unset=True)
                if isinstance(filters, BaseModel)
                else filters
            )

            for field, value in filter_data.items():
                if value is not None and hasattr(self.model, field):
                    query = query.filter(getattr(self.model, field) == value)

        return query.all()

    def create(self, db: Session, obj_in: Any, commit: bool = True) -> T:
        if isinstance(obj_in, self.model):
            db_obj = obj_in
        elif hasattr(obj_in, "model_dump"):
            db_obj = self.model(**obj_in.model_dump())
        else:
            db_obj = self.model(**obj_in)

        db.add(db_obj)

        try:
            if commit:
                db.commit()
                db.refresh(db_obj)
        except SQLAlchemyError:
            db.rollback()
            raise

        return db_obj

    def update(self, db: Session, db_obj: T, obj_in: Any, commit: bool = True) -> T:
        updated_data = (
            obj_in.model_dump(exclude_unset=True) if hasattr(obj_in, "model_dump") else obj_in
        )

        for field, value in updated_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        db.add(db_obj)

        try:
            if commit:
                db.commit()
                db.refresh(db_obj)
        except SQLAlchemyError:
            db.rollback()
            raise

        return db_obj

    def get_by_id(
        self, db: Session, id: Any, load_relationships: list[str] | None = None
    ) -> T | None:

        query = db.query(self.model)

        if load_relationships:
            for rel in load_relationships:
                if hasattr(self.model, rel):
                    query = query.options(joinedload(getattr(self.model, rel)))

        return query.filter(self.model.id == id).first()

    def delete(self, db: Session, id: Any) -> T | None:
        obj = self.get_by_id(db, id)

        if not obj:
            return None

        try:
            db.delete(obj)
            db.commit()
        except SQLAlchemyError:
            db.rollback()
            raise

        return obj
