from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from src.common.db.session import get_db
from src.modules.auth.schema import AuthToken
from src.modules.auth.service import AuthService
from src.modules.stats.schema import StatsResponse
from src.modules.stats.service import StatsService

router = APIRouter()

stats_service = StatsService()
auth_service = AuthService()


@router.get("/stats", response_model=StatsResponse)
def get_stats(
    request: Request,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.security_service.verify_auth_token),
):
    """Return platform-wide statistics for the authenticated user."""
    return stats_service.get_stats(db=db, user_id=token_payload.id)
