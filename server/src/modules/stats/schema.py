from pydantic import BaseModel

# ── Summary ─────────────────────────────────────────────────────────────────


class SummarySchema(BaseModel):
    total_datasets: int
    total_models: int
    avg_accuracy: float  # percentage 0-100
    best_accuracy: float
    worst_accuracy: float
    total_storage_bytes: int


# ── Model type distribution ──────────────────────────────────────────────────


class ModelTypeDistributionItem(BaseModel):
    type: str
    count: int


# ── Timeline ─────────────────────────────────────────────────────────────────


class ModelTimelineItem(BaseModel):
    date: str
    models: int
    avg_accuracy: float  # percentage 0-100


class DatasetTimelineItem(BaseModel):
    date: str
    datasets: int


# ── Recent items ─────────────────────────────────────────────────────────────


class RecentModelItem(BaseModel):
    id: str
    name: str
    model_type: str
    accuracy: float  # percentage 0-100
    version: str
    created_at: str


class RecentDatasetItem(BaseModel):
    id: str
    name: str
    rows: int
    columns: int
    version: str
    created_at: str


# ── Full stats response ───────────────────────────────────────────────────────


class StatsResponse(BaseModel):
    summary: SummarySchema
    model_type_distribution: list[ModelTypeDistributionItem]
    models_over_time: list[ModelTimelineItem]
    datasets_over_time: list[DatasetTimelineItem]
    recent_models: list[RecentModelItem]
    recent_datasets: list[RecentDatasetItem]
