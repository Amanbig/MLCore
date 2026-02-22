from fastapi import APIRouter, Depends, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.common.db.session import get_db
from src.modules.auth.schema import AuthToken
from src.modules.auth.service import AuthService
from src.modules.dataset.store.models import Dataset
from src.modules.file.store.model import Files
from src.modules.ml_model.store.model import MLModel

router = APIRouter()
auth_service = AuthService()


@router.get("/stats")
def get_stats(
    request: Request,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.security_service.verify_auth_token),
):
    user_id = token_payload.id

    # Counts
    total_datasets = (
        db.query(func.count(Dataset.id)).filter(Dataset.user_id == user_id).scalar() or 0
    )
    total_models = db.query(func.count(MLModel.id)).filter(MLModel.user_id == user_id).scalar() or 0

    # Accuracy stats
    accuracy_row = (
        db.query(func.avg(MLModel.accuracy), func.max(MLModel.accuracy), func.min(MLModel.accuracy))
        .filter(MLModel.user_id == user_id)
        .first()
    )
    avg_accuracy = float(accuracy_row[0]) if accuracy_row[0] is not None else 0.0
    best_accuracy = float(accuracy_row[1]) if accuracy_row[1] is not None else 0.0
    worst_accuracy = float(accuracy_row[2]) if accuracy_row[2] is not None else 0.0

    # Storage used (sum of file sizes owned by user)
    size_row = db.query(func.sum(Files.size)).filter(Files.user_id == user_id).scalar()
    # size is stored as string, try to sum numerically
    files = db.query(Files.size).filter(Files.user_id == user_id).all()
    total_storage_bytes = sum(int(r[0]) for r in files if r[0] and r[0].isdigit())

    # Model type distribution
    model_type_rows = (
        db.query(MLModel.model_type, func.count(MLModel.id))
        .filter(MLModel.user_id == user_id)
        .group_by(MLModel.model_type)
        .all()
    )
    model_type_dist = [{"type": r[0], "count": r[1]} for r in model_type_rows]

    # Models over time (by created_at date, for chart)
    models_over_time_rows = (
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
    models_over_time = [
        {
            "date": str(r[0]),
            "models": r[1],
            "avg_accuracy": round(float(r[2]) * 100, 1) if r[2] else 0,
        }
        for r in models_over_time_rows
    ]

    # Datasets over time
    datasets_over_time_rows = (
        db.query(
            func.date(Dataset.created_at).label("date"),
            func.count(Dataset.id).label("count"),
        )
        .filter(Dataset.user_id == user_id)
        .group_by(func.date(Dataset.created_at))
        .order_by(func.date(Dataset.created_at))
        .all()
    )
    datasets_over_time = [{"date": str(r[0]), "datasets": r[1]} for r in datasets_over_time_rows]

    # Recent models (last 10)
    recent_models = (
        db.query(MLModel)
        .filter(MLModel.user_id == user_id)
        .order_by(MLModel.created_at.desc())
        .limit(10)
        .all()
    )
    recent_models_list = [
        {
            "id": str(m.id),
            "name": m.name,
            "model_type": m.model_type,
            "accuracy": round(float(m.accuracy) * 100, 2),
            "version": m.version,
            "created_at": str(m.created_at),
        }
        for m in recent_models
    ]

    # Recent datasets (last 5)
    recent_datasets = (
        db.query(Dataset)
        .filter(Dataset.user_id == user_id)
        .order_by(Dataset.created_at.desc())
        .limit(5)
        .all()
    )
    recent_datasets_list = [
        {
            "id": str(d.id),
            "name": d.name,
            "rows": d.rows,
            "columns": d.columns,
            "version": d.version,
            "created_at": str(d.created_at),
        }
        for d in recent_datasets
    ]

    return {
        "summary": {
            "total_datasets": total_datasets,
            "total_models": total_models,
            "avg_accuracy": round(avg_accuracy * 100, 1),
            "best_accuracy": round(best_accuracy * 100, 1),
            "worst_accuracy": round(worst_accuracy * 100, 1),
            "total_storage_bytes": total_storage_bytes,
        },
        "model_type_distribution": model_type_dist,
        "models_over_time": models_over_time,
        "datasets_over_time": datasets_over_time,
        "recent_models": recent_models_list,
        "recent_datasets": recent_datasets_list,
    }
