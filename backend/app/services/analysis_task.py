"""
Analysis pipeline: clone → inspect → persist → cleanup.

This module contains the background task that is launched by the analysis
endpoint.  It runs outside the HTTP request lifecycle, so it creates its own
database session via AsyncSessionLocal (never reuses a request-scoped session).

Security invariants:
  - Repository code is NEVER executed.
  - `git clone` is called with a subprocess with a hard timeout.
  - The temporary directory is always cleaned up (success or failure).
  - Internal paths are never returned to callers; only safe messages are stored.
"""
from __future__ import annotations

import asyncio
import json
import logging
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select

from app.core.analysis_config import (
    CLONE_TIMEOUT_SECONDS,
    MAX_REPO_SIZE_BYTES,
)
from app.core.database import AsyncSessionLocal
from app.models.repository import Repository
from app.services.analyzer import analyze_repository

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def _update_repo(repository_id: str, **fields: object) -> None:
    """Open a fresh session and update the repository record."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Repository).where(Repository.id == repository_id)
        )
        repo = result.scalar_one_or_none()
        if repo is None:
            logger.error("analysis_task: repository %s not found in DB", repository_id)
            return
        for key, value in fields.items():
            setattr(repo, key, value)
        repo.updated_at = _utcnow()
        await session.commit()


def _dir_size(path: Path) -> int:
    """Return total bytes consumed by all files under *path*."""
    total = 0
    for p in path.rglob("*"):
        if p.is_file():
            try:
                total += p.stat().st_size
            except OSError:
                pass
    return total


def _clone_repository(url: str, target_dir: Path) -> tuple[bool, str]:
    """
    Run ``git clone --depth 1 <url> <target_dir>`` in a subprocess.

    Returns (success: bool, message: str).
    The process is killed after CLONE_TIMEOUT_SECONDS.
    No shell=True — arguments are passed as a list.

    Security note: we inherit the parent process environment and then
    override/add only the Git-specific variables that suppress credential
    prompts.  A fully stripped env dict breaks DNS resolution on Windows
    (getaddrinfo() thread failed to start) because SYSTEMROOT and related
    Windows variables are required by the socket/DNS subsystem.
    """
    cmd = [
        "git", "clone",
        "--depth", "1",
        "--no-tags",
        "--single-branch",
        url,
        str(target_dir),
    ]
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            timeout=CLONE_TIMEOUT_SECONDS,
            # Never use shell=True
            shell=False,
            # Inherit the full OS environment so that system networking
            # libraries (DNS, TLS) work correctly on all platforms, then
            # override only the variables that control Git credentials.
            env=_git_env(),
        )
        if proc.returncode != 0:
            stderr = proc.stderr.decode("utf-8", errors="replace").strip()
            # Sanitize: remove any path-like tokens from git's error output
            safe_msg = _sanitize_git_error(stderr)
            return False, safe_msg
        return True, "ok"
    except subprocess.TimeoutExpired:
        return False, f"Clone timed out after {CLONE_TIMEOUT_SECONDS}s"
    except FileNotFoundError:
        return False, "git executable not found — please install Git"
    except OSError as exc:
        return False, f"Clone failed: {exc.__class__.__name__}"


def _git_env() -> dict[str, str]:
    """
    Return the environment dict for the git subprocess.

    Starts from the full parent environment so that OS networking (DNS,
    TLS, certificate stores) works on all platforms — in particular,
    Windows requires SYSTEMROOT for getaddrinfo() to function.

    Security overrides applied on top:
      GIT_TERMINAL_PROMPT=0   — never display a terminal password prompt
      GIT_ASKPASS=echo        — return empty string for any credential query
      GIT_CONFIG_NOSYSTEM=1   — ignore /etc/gitconfig (reduces attack surface)
    """
    import os
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    env["GIT_ASKPASS"] = "echo"
    env["GIT_CONFIG_NOSYSTEM"] = "1"
    return env


def _sanitize_git_error(stderr: str) -> str:
    """
    Return a user-safe version of a git error message.

    Strips local filesystem paths and credential-related lines.
    Keeps only the first meaningful line (≤ 200 chars).
    """
    safe_lines = []
    for line in stderr.splitlines():
        line = line.strip()
        if not line:
            continue
        # Drop lines that look like absolute paths or contain credentials
        if line.startswith("/") or "\\" in line or "password" in line.lower():
            continue
        safe_lines.append(line[:200])
        if len(safe_lines) >= 3:
            break

    if not safe_lines:
        return "Repository clone failed."
    return " | ".join(safe_lines)


# ---------------------------------------------------------------------------
# Main background task
# ---------------------------------------------------------------------------

async def run_analysis(repository_id: str, clone_url: str) -> None:
    """
    Full analysis pipeline executed as a FastAPI BackgroundTask.

    Stages:
      queued → cloning_repository → parsing_structure → completed
                                  ↘ failed (at any stage)
    """
    logger.info("analysis_task[%s]: starting for %s", repository_id, clone_url)

    # ── Stage: queued ────────────────────────────────────────────────────────
    await _update_repo(
        repository_id,
        status="queued",
        analysis_started_at=_utcnow(),
        error_message=None,
    )

    tmp_dir: tempfile.TemporaryDirectory | None = None
    repo_path: Path | None = None

    try:
        # Create a per-job temporary directory that is cleaned up automatically
        tmp_dir = tempfile.TemporaryDirectory(prefix="repoguide_")
        repo_path = Path(tmp_dir.name) / "repo"

        # ── Stage: cloning_repository ────────────────────────────────────────
        await _update_repo(repository_id, status="cloning_repository")

        # Run blocking subprocess in a thread pool so we don't block the event loop
        success, message = await asyncio.get_event_loop().run_in_executor(
            None, _clone_repository, clone_url, repo_path
        )

        if not success:
            logger.warning("analysis_task[%s]: clone failed: %s", repository_id, message)
            await _update_repo(
                repository_id,
                status="failed",
                error_message=message,
                analysis_completed_at=_utcnow(),
            )
            return

        # Check repository size before proceeding
        repo_size = await asyncio.get_event_loop().run_in_executor(
            None, _dir_size, repo_path
        )
        if repo_size > MAX_REPO_SIZE_BYTES:
            size_mb = repo_size // (1024 * 1024)
            await _update_repo(
                repository_id,
                status="failed",
                error_message=f"Repository is too large ({size_mb} MB). Maximum is {MAX_REPO_SIZE_BYTES // (1024 * 1024)} MB.",
                analysis_completed_at=_utcnow(),
            )
            return

        # ── Stage: parsing_structure ─────────────────────────────────────────
        await _update_repo(repository_id, status="parsing_structure")

        analysis = await asyncio.get_event_loop().run_in_executor(
            None, analyze_repository, repo_path
        )

        # Detect default branch from HEAD file (safe read, no execution)
        default_branch: str | None = None
        head_file = repo_path / ".git" / "HEAD"
        if head_file.is_file():
            try:
                head_content = head_file.read_text(encoding="utf-8", errors="replace").strip()
                # HEAD typically contains: ref: refs/heads/main
                if head_content.startswith("ref: refs/heads/"):
                    default_branch = head_content.removeprefix("ref: refs/heads/")
            except OSError:
                pass

        # ── Stage: completed ─────────────────────────────────────────────────
        await _update_repo(
            repository_id,
            status="completed",
            file_count=analysis.file_count,
            directory_count=analysis.directory_count,
            technologies=",".join(analysis.technologies),
            top_level_dirs=json.dumps(analysis.top_level_dirs),
            extension_counts=json.dumps(analysis.extension_counts),
            default_branch=default_branch,
            analysis_completed_at=_utcnow(),
            error_message=None,
        )
        logger.info(
            "analysis_task[%s]: completed — %d files, %d dirs, techs=%s",
            repository_id,
            analysis.file_count,
            analysis.directory_count,
            analysis.technologies,
        )

    except Exception:
        logger.exception("analysis_task[%s]: unexpected error", repository_id)
        await _update_repo(
            repository_id,
            status="failed",
            error_message="An unexpected error occurred during analysis.",
            analysis_completed_at=_utcnow(),
        )

    finally:
        # Always clean up the temporary directory
        if tmp_dir is not None:
            try:
                tmp_dir.cleanup()
                logger.info("analysis_task[%s]: temporary directory cleaned up", repository_id)
            except OSError as exc:
                logger.warning("analysis_task[%s]: cleanup failed: %s", repository_id, exc)
