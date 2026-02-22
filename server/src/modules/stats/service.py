from uuid import UUID

from sqlalchemy.orm import Session

from src.common.logging.logger import log_execution
from src.modules.stats.schema import (
    DatasetTimelineItem,
    ModelTimelineItem,
    ModelTypeDistributionItem,
    RecentDatasetItem,
    RecentModelItem,
    StatsResponse,
    SummarySchema,
)
from src.modules.stats.store.repository import StatsRepository


class StatsService:
    def __init__(self):
        self.repo = StatsRepository()

    @log_execution
    def get_stats(self, db: Session, user_id: UUID) -> StatsResponse:
        # Summary counts
        total_datasets = self.repo.get_dataset_count(db=db, user_id=user_id)
        total_models = self.repo.get_model_count(db=db, user_id=user_id)

        # Accuracy
        avg_acc, best_acc, worst_acc = self.repo.get_accuracy_stats(db=db, user_id=user_id)

        # Storage
        storage_bytes = self.repo.get_total_storage_bytes(db=db, user_id=user_id)

        # Model type distribution
        dist_raw = self.repo.get_model_type_distribution(db=db, user_id=user_id)
        model_type_distribution = [ModelTypeDistributionItem(**d) for d in dist_raw]

        # Timelines
        models_over_time = [
            ModelTimelineItem(**m) for m in self.repo.get_models_over_time(db=db, user_id=user_id)
        ]
        datasets_over_time = [
            DatasetTimelineItem(**d)
            for d in self.repo.get_datasets_over_time(db=db, user_id=user_id)
        ]

        # Recent items
        recent_models = [
            RecentModelItem(
                id=str(m.id),
                name=m.name,
                model_type=m.model_type,
                accuracy=round(float(m.accuracy) * 100, 2),
                version=m.version,
                created_at=str(m.created_at),
            )
            for m in self.repo.get_recent_models(db=db, user_id=user_id)
        ]
        recent_datasets = [
            RecentDatasetItem(
                id=str(d.id),
                name=d.name,
                rows=d.rows,
                columns=d.columns,
                version=d.version,
                created_at=str(d.created_at),
            )
            for d in self.repo.get_recent_datasets(db=db, user_id=user_id)
        ]

        return StatsResponse(
            summary=SummarySchema(
                total_datasets=total_datasets,
                total_models=total_models,
                avg_accuracy=round(avg_acc * 100, 1),
                best_accuracy=round(best_acc * 100, 1),
                worst_accuracy=round(worst_acc * 100, 1),
                total_storage_bytes=storage_bytes,
            ),
            model_type_distribution=model_type_distribution,
            models_over_time=models_over_time,
            datasets_over_time=datasets_over_time,
            recent_models=recent_models,
            recent_datasets=recent_datasets,
        )
