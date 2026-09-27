import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.repository import Repository
from app.schemas.repository import RepositoryCreate


async def create_repository(
    db: AsyncSession, payload: RepositoryCreate
) -> Repository:
    """Insert a new Repository record and return it."""
    # Derive a short display name from the URL path  (owner/repo)
    parts = payload.url.rstrip("/").split("/")
    name = "/".join(parts[-2:]) if len(parts) >= 2 else None

    repo = Repository(
        id=str(uuid.uuid4()),
        url=payload.url,
        name=name,
        status="created",
    )
    db.add(repo)
    await db.flush()
    await db.refresh(repo)
    return repo


async def get_repository(db: AsyncSession, repository_id: str) -> Repository | None:
    """Return a Repository by id, or None if not found."""
    result = await db.execute(
        select(Repository).where(Repository.id == repository_id)
    )
    return result.scalar_one_or_none()
