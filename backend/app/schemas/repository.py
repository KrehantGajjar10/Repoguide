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
