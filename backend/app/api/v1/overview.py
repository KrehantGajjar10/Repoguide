"""API endpoints for Project Overview and Architecture Explorer."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.overview_architecture import (
    ArchitectureResponse,
    ProjectOverviewResponse,
    build_architecture_response,
    build_overview_response,
)
from app.services.architecture_generator import generate_architecture
from app.services.overview_generator import generate_overview
from app.services.repository_service import get_repository

router = APIRouter(prefix="/repositories", tags=["overview"])

_ANALYSIS_COMPLETE = "completed"


def _require_completed(repo, repository_id: str) -> None:
    """Raise 404 / 400 as appropriate for non-ready repositories."""
    if repo is None:
        raise HTTPException(
            status_code=404,
            detail={"status": "error", "message": f"Repository '{repository_id}' not found."},
        )
    if repo.status != _ANALYSIS_COMPLETE:
        raise HTTPException(
            status_code=400,
            detail={
                "status": "error",
                "message": (
                    f"Analysis not complete yet. Current status: {repo.status}. "
                    "Please wait for analysis to finish before requesting overview/architecture."
                ),
            },
        )


@router.get("/{repository_id}/overview", response_model=ProjectOverviewResponse)
async def get_overview(
    repository_id: str,
    db: AsyncSession = Depends(get_db),
) -> ProjectOverviewResponse:
    """
    Return a deterministic project overview derived from Chapter 2 analysis data.
    Requires analysis status == completed.
    """
    repo = await get_repository(db, repository_id)
    _require_completed(repo, repository_id)

    result = generate_overview(
        repo_id=repo.id,
        repo_name=repo.name,
        repo_url=repo.url,
        status=repo.status,
        file_count=repo.file_count,
        directory_count=repo.directory_count,
        technologies_csv=repo.technologies,
        top_level_dirs_json=repo.top_level_dirs,
        extension_counts_json=repo.extension_counts,
        manifest_files_csv=None,   # not stored separately; derived from tech detection
        default_branch=repo.default_branch,
    )
    return build_overview_response(repo, result)


@router.get("/{repository_id}/architecture", response_model=ArchitectureResponse)
async def get_architecture(
    repository_id: str,
    db: AsyncSession = Depends(get_db),
) -> ArchitectureResponse:
    """
    Return a deterministic architecture representation derived from Chapter 2 analysis data.
    Requires analysis status == completed.
    """
    repo = await get_repository(db, repository_id)
    _require_completed(repo, repository_id)

    result = generate_architecture(
        repo_id=repo.id,
        repo_name=repo.name,
        repo_url=repo.url,
        technologies_csv=repo.technologies,
        top_level_dirs_json=repo.top_level_dirs,
        extension_counts_json=repo.extension_counts,
        default_branch=repo.default_branch,
        file_count=repo.file_count,
    )
    return build_architecture_response(repo, result)
