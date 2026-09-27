import json
import re
from datetime import datetime

from pydantic import BaseModel, field_validator

# GitHub HTTPS URL: https://github.com/owner/repo  (optional .git suffix)
_GITHUB_URL_RE = re.compile(
    r"^https://github\.com/[A-Za-z0-9_.\-]+/[A-Za-z0-9_.\-]+(/?)$"
)


class RepositoryCreate(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_github_url(cls, v: str) -> str:
        v = v.strip().rstrip("/")
        # Remove optional .git suffix for normalisation
        if v.endswith(".git"):
            v = v[:-4]
        if not _GITHUB_URL_RE.match(v + "/"):
            raise ValueError(
                "URL must be a valid GitHub repository URL "
                "(https://github.com/owner/repo)"
            )
        return v


class RepositoryRead(BaseModel):
    id: str
    url: str
    name: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Analysis response schemas
# ---------------------------------------------------------------------------

class AnalysisStarted(BaseModel):
    """Returned immediately when POST /repositories/{id}/analyze is called."""
    repository_id: str
    status: str
    message: str


class AnalysisStatus(BaseModel):
    """
    Returned by GET /repositories/{id}/analysis.

    Fields beyond status/progress are None while analysis is in progress.
    """
    repository_id: str
    status: str
    progress: int  # 0-100 — derived from status for simplicity
    message: str

    # Populated only when status == "completed"
    file_count: int | None = None
    directory_count: int | None = None
    technologies: list[str] | None = None
    top_level_dirs: list[str] | None = None
    extension_counts: dict[str, int] | None = None
    default_branch: str | None = None
    repository_name: str | None = None
    repository_url: str | None = None
    analysis_started_at: datetime | None = None
    analysis_completed_at: datetime | None = None

    # Populated only when status == "failed"
    error_message: str | None = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Status → progress mapping
# ---------------------------------------------------------------------------

_STATUS_PROGRESS: dict[str, int] = {
    "created": 0,
    "queued": 5,
    "cloning_repository": 25,
    "parsing_structure": 65,
    "completed": 100,
    "failed": 0,
}

_STATUS_MESSAGE: dict[str, str] = {
    "created": "Repository registered, waiting to start analysis.",
    "queued": "Analysis queued, starting shortly.",
    "cloning_repository": "Cloning repository…",
    "parsing_structure": "Analyzing repository structure…",
    "completed": "Analysis complete.",
    "failed": "Analysis failed.",
}


def build_analysis_status(repo: object) -> AnalysisStatus:
    """Convert a Repository ORM object to an AnalysisStatus schema."""
    status: str = getattr(repo, "status", "created")
    progress = _STATUS_PROGRESS.get(status, 0)
    message = _STATUS_MESSAGE.get(status, status)

    techs: list[str] | None = None
    raw_techs: str | None = getattr(repo, "technologies", None)
    if raw_techs:
        techs = [t.strip() for t in raw_techs.split(",") if t.strip()]

    top_dirs: list[str] | None = None
    raw_dirs: str | None = getattr(repo, "top_level_dirs", None)
    if raw_dirs:
        try:
            top_dirs = json.loads(raw_dirs)
        except (json.JSONDecodeError, TypeError):
            top_dirs = None

    ext_counts: dict[str, int] | None = None
    raw_exts: str | None = getattr(repo, "extension_counts", None)
    if raw_exts:
        try:
            ext_counts = json.loads(raw_exts)
        except (json.JSONDecodeError, TypeError):
            ext_counts = None

    return AnalysisStatus(
        repository_id=getattr(repo, "id", ""),
        status=status,
        progress=progress,
        message=message,
        file_count=getattr(repo, "file_count", None),
        directory_count=getattr(repo, "directory_count", None),
        technologies=techs,
        top_level_dirs=top_dirs,
        extension_counts=ext_counts,
        default_branch=getattr(repo, "default_branch", None),
        repository_name=getattr(repo, "name", None),
        repository_url=getattr(repo, "url", None),
        analysis_started_at=getattr(repo, "analysis_started_at", None),
        analysis_completed_at=getattr(repo, "analysis_completed_at", None),
        error_message=getattr(repo, "error_message", None) if status == "failed" else None,
    )
