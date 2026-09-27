from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.repository import RepositoryCreate, RepositoryRead
from app.services.repository_service import create_repository, get_repository

router = APIRouter(prefix="/repositories", tags=["repositories"])


@router.post("", response_model=RepositoryRead, status_code=201)
async def post_repository(
    payload: RepositoryCreate,
    db: AsyncSession = Depends(get_db),
) -> RepositoryRead:
    """
    Accept a GitHub repository URL, persist it with status ``created``,
    and return the record.  No cloning or analysis happens here.
    """
    repo = await create_repository(db, payload)
    return RepositoryRead.model_validate(repo)


@router.get("/{repository_id}", response_model=RepositoryRead)
async def get_repository_by_id(
    repository_id: str,
    db: AsyncSession = Depends(get_db),
) -> RepositoryRead:
    """Return a stored repository by its UUID."""
    repo = await get_repository(db, repository_id)
    if repo is None:
        raise HTTPException(
            status_code=404,
            detail={
                "status": "error",
                "message": f"Repository '{repository_id}' not found.",
            },
        )
    return RepositoryRead.model_validate(repo)
