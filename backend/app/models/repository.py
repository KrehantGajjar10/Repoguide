import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    name: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # -------------------------------------------------------------------------
    # Analysis lifecycle
    # -------------------------------------------------------------------------
    # Statuses: created | queued | cloning_repository | parsing_structure
    #           | completed | failed
    status: Mapped[str] = mapped_column(String(64), nullable=False, default="created")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    analysis_started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    analysis_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # -------------------------------------------------------------------------
    # Structural results (populated after parsing_structure)
    # -------------------------------------------------------------------------
    file_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    directory_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Comma-separated technology labels, e.g. "Python,FastAPI,React"
    technologies: Mapped[str | None] = mapped_column(Text, nullable=True)
    # JSON-encoded list of top-level directory names
    top_level_dirs: Mapped[str | None] = mapped_column(Text, nullable=True)
    # JSON-encoded dict of extension → count
    extension_counts: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Default branch detected from clone (HEAD)
    default_branch: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # -------------------------------------------------------------------------
    # Timestamps
    # -------------------------------------------------------------------------
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
