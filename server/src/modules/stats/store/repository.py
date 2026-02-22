from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from src.modules.dataset.store.models import Dataset
from src.modules.file.store.model import Files
from src.modules.ml_model.store.model import MLModel


class StatsRepository:
    """All raw DB queries for the stats module."""

    def get_dataset_count(self, db: Session, user_id: UUID) -> int:
        return db.query(func.count(Dataset.id)).filter(Dataset.user_id == user_id).scalar() or 0

    def get_model_count(self, db: Session, user_id: UUID) -> int:
        return db.query(func.count(MLModel.id)).filter(MLModel.user_id == user_id).scalar() or 0

    def get_accuracy_stats(self, db: Session, user_id: UUID) -> tuple[float, float, float]:
        """Returns (avg, best, worst) as fractions 0-1."""
        row = (
            db.query(
                func.avg(MLModel.accuracy),
                func.max(MLModel.accuracy),
                func.min(MLModel.accuracy),
            )
            .filter(MLModel.user_id == user_id)
            .first()
        )
        avg = float(row[0]) if row[0] is not None else 0.0
        best = float(row[1]) if row[1] is not None else 0.0
        worst = float(row[2]) if row[2] is not None else 0.0
        return avg, best, worst

    def get_total_storage_bytes(self, db: Session, user_id: UUID) -> int:
        rows = db.query(Files.size).filter(Files.user_id == user_id).all()
        return sum(int(r[0]) for r in rows if r[0] and str(r[0]).isdigit())

    def get_model_type_distribution(self, db: Session, user_id: UUID) -> list[dict]:
        rows = (
            db.query(MLModel.model_type, func.count(MLModel.id))
            .filter(MLModel.user_id == user_id)
            .group_by(MLModel.model_type)
            .all()
        )
        return [{"type": r[0], "count": r[1]} for r in rows]

    def get_models_over_time(self, db: Session, user_id: UUID) -> list[dict]:
        rows = (
            db.query(
                func.date(MLModel.created_at).label("date"),
                func.count(MLModel.id).label("count"),
                func.avg(MLModel.accuracy).label("avg_accuracy"),
            )
            .filter(MLModel.user_id == user_id)
            .group_by(func.date(MLModel.created_at))
            .order_by(func.date(MLModel.created_at))
            .all()
        )
        return [
            {
                "date": str(r[0]),
                "models": r[1],
                "avg_accuracy": round(float(r[2]) * 100, 1) if r[2] else 0,
            }
            for r in rows
        ]

    def get_datasets_over_time(self, db: Session, user_id: UUID) -> list[dict]:
        rows = (
            db.query(
                func.date(Dataset.created_at).label("date"),
                func.count(Dataset.id).label("count"),
            )
            .filter(Dataset.user_id == user_id)
            .group_by(func.date(Dataset.created_at))
            .order_by(func.date(Dataset.created_at))
            .all()
        )
        return [{"date": str(r[0]), "datasets": r[1]} for r in rows]

    def get_recent_models(self, db: Session, user_id: UUID, limit: int = 10) -> list[MLModel]:
        return (
            db.query(MLModel)
            .filter(MLModel.user_id == user_id)
            .order_by(MLModel.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_recent_datasets(self, db: Session, user_id: UUID, limit: int = 5) -> list[Dataset]:
        return (
            db.query(Dataset)
            .filter(Dataset.user_id == user_id)
            .order_by(Dataset.created_at.desc())
            .limit(limit)
            .all()
        )
