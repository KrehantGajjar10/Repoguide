from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.repository import (
    AnalysisStarted,
    AnalysisStatus,
    RepositoryCreate,
    RepositoryRead,
    build_analysis_status,
)
from app.services.analysis_task import run_analysis
from app.services.repository_service import create_repository, get_repository

router = APIRouter(prefix="/repositories", tags=["repositories"])


# ---------------------------------------------------------------------------
# Chapter 1 endpoints (unchanged contract)
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Chapter 2 endpoints
# ---------------------------------------------------------------------------

@router.post("/{repository_id}/analyze", response_model=AnalysisStarted, status_code=202)
async def start_analysis(
    repository_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> AnalysisStarted:
    """
    Start an asynchronous analysis pipeline for the given repository.

    Returns immediately with 202 Accepted; the clone + structural analysis
    runs in the background.  Poll GET /repositories/{id}/analysis for status.
    """
    repo = await get_repository(db, repository_id)
    if repo is None:
        raise HTTPException(
            status_code=404,
            detail={
                "status": "error",
                "message": f"Repository '{repository_id}' not found.",
            },
        )

    # Idempotency: if already running or completed, return current status
    if repo.status in ("queued", "cloning_repository", "parsing_structure"):
        return AnalysisStarted(
            repository_id=repository_id,
            status=repo.status,
            message="Analysis is already in progress.",
        )

    if repo.status == "completed":
        return AnalysisStarted(
            repository_id=repository_id,
            status="completed",
            message="Analysis already completed. Fetch results via GET /repositories/{id}/analysis.",
        )

    # Schedule background task — it creates its own DB session
    background_tasks.add_task(run_analysis, repository_id, repo.url)

    return AnalysisStarted(
        repository_id=repository_id,
        status="queued",
        message="Analysis started. Poll GET /repositories/{id}/analysis for status.",
    )


@router.get("/{repository_id}/analysis", response_model=AnalysisStatus)
async def get_analysis_status(
    repository_id: str,
    db: AsyncSession = Depends(get_db),
) -> AnalysisStatus:
    """
    Return the current analysis state and results for a repository.

    While processing, returns the current status and progress percentage.
    When completed, includes structural results (file count, technologies, etc.).
    When failed, includes a safe error message.
    """
    repo = await get_repository(db, repository_id)
    if repo is None:
        raise HTTPException(
            status_code=404,
            detail={
                "status": "error",
                "message": f"Repository '{repository_id}' not found.",
            },
        )
    return build_analysis_status(repo)
