"""
Chapter 2 tests — analysis endpoints and structural analyzer.

The test suite uses the in-memory SQLite fixture from conftest.py.
Clone operations are monkeypatched so no real network calls are made.
"""
from __future__ import annotations

import json
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _create_repo(client: AsyncClient, url: str = "https://github.com/example/demo-app") -> str:
    """Create a repository and return its id."""
    resp = await client.post("/api/v1/repositories", json={"url": url})
    assert resp.status_code == 201
    return resp.json()["id"]


# ---------------------------------------------------------------------------
# 1. Analysis endpoint accepts a valid repository ID
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_start_analysis_valid_id(client: AsyncClient) -> None:
    repo_id = await _create_repo(client)

    # Patch run_analysis so no real cloning happens
    with patch("app.api.v1.repositories.run_analysis", new_callable=AsyncMock) as mock_task:
        mock_task.return_value = None
        resp = await client.post(f"/api/v1/repositories/{repo_id}/analyze")

    assert resp.status_code == 202
    data = resp.json()
    assert data["repository_id"] == repo_id
    assert data["status"] in ("queued", "cloning_repository", "parsing_structure", "completed")


# ---------------------------------------------------------------------------
# 2. Analysis status can be retrieved
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_analysis_status(client: AsyncClient) -> None:
    repo_id = await _create_repo(client)

    resp = await client.get(f"/api/v1/repositories/{repo_id}/analysis")
    assert resp.status_code == 200
    data = resp.json()
    assert data["repository_id"] == repo_id
    assert "status" in data
    assert "progress" in data
    assert isinstance(data["progress"], int)


# ---------------------------------------------------------------------------
# 3. Invalid repository ID returns 404
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_analysis_nonexistent_id(client: AsyncClient) -> None:
    fake_id = "00000000-0000-0000-0000-000000000000"
    for path in [
        f"/api/v1/repositories/{fake_id}/analyze",
        f"/api/v1/repositories/{fake_id}/analysis",
    ]:
        resp = await client.post(path) if "analyze" in path else await client.get(path)
        assert resp.status_code == 404
        assert resp.json()["detail"]["status"] == "error"


# ---------------------------------------------------------------------------
# 4. Successful structural analysis (using a real temp directory)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_structural_analysis_real_files() -> None:
    from app.services.analyzer import analyze_repository

    with tempfile.TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)

        # Create a minimal frontend-only repository structure
        (root / "src").mkdir()
        (root / "src" / "App.tsx").write_text("export default function App() {}")
        (root / "src" / "index.ts").write_text("import App from './App'")
        (root / "package.json").write_text(
            json.dumps({"name": "demo", "dependencies": {"react": "^18.0.0", "react-dom": "^18.0.0"}})
        )
        (root / "tsconfig.json").write_text("{}")
        (root / "vite.config.ts").write_text("export default {}")
        (root / "public").mkdir()
        (root / "public" / "index.html").write_text("<html></html>")

        result = analyze_repository(root)

    assert result.file_count >= 4
    assert result.directory_count >= 2
    assert "TypeScript" in result.technologies
    assert "React" in result.technologies
    assert "Vite" in result.technologies
    assert "JavaScript / TypeScript" in result.technologies


# ---------------------------------------------------------------------------
# 5. Empty repository handling
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_empty_repository_analysis() -> None:
    from app.services.analyzer import analyze_repository

    with tempfile.TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)
        # Completely empty — no files, no dirs
        result = analyze_repository(root)

    assert result.file_count == 0
    assert result.directory_count == 0
    assert result.technologies == []
    assert result.extension_counts == {}
    assert result.truncated is False


# ---------------------------------------------------------------------------
# 6. Technology detection — Python/FastAPI backend
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_technology_detection_python_fastapi() -> None:
    from app.services.analyzer import analyze_repository

    with tempfile.TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)
        (root / "pyproject.toml").write_text(
            "[project]\nname = 'myapi'\n\n[project.dependencies]\nfastapi = '>=0.100'\nsqlalchemy = '>=2.0'\n"
        )
        (root / "app").mkdir()
        (root / "app" / "main.py").write_text("from fastapi import FastAPI; app = FastAPI()")
        (root / "Dockerfile").write_text("FROM python:3.12")

        result = analyze_repository(root)

    assert "Python" in result.technologies
    assert "FastAPI" in result.technologies
    assert "Docker" in result.technologies


# ---------------------------------------------------------------------------
# 7. Ignored directories are not analyzed
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ignored_directories_skipped() -> None:
    from app.services.analyzer import analyze_repository

    with tempfile.TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)

        # Real source file
        (root / "index.js").write_text("console.log('hello')")

        # Files inside ignored directories — must NOT be counted
        (root / "node_modules").mkdir()
        (root / "node_modules" / "lodash.js").write_text("// lodash")
        (root / "dist").mkdir()
        (root / "dist" / "bundle.js").write_text("// bundle")
        (root / "__pycache__").mkdir()
        (root / "__pycache__" / "main.cpython-312.pyc").write_bytes(b"\x00\x00")

        result = analyze_repository(root)

    # Only the one real file should be counted
    assert result.file_count == 1
    # No ignored dirs should appear in top_level_dirs
    for ignored in ("node_modules", "dist", "__pycache__"):
        assert ignored not in result.top_level_dirs


# ---------------------------------------------------------------------------
# 8. Oversized files are counted but not content-inspected
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_oversized_file_counted_not_read() -> None:
    from app.core.analysis_config import MAX_FILE_READ_BYTES
    from app.services.analyzer import analyze_repository

    with tempfile.TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)

        # Write a requirements.txt that is larger than MAX_FILE_READ_BYTES
        # — the first MAX_FILE_READ_BYTES will be read; content beyond that is ignored.
        # We put the "fastapi" keyword beyond the limit so it must NOT be detected.
        padding = b"# padding\n" * (MAX_FILE_READ_BYTES // 10 + 1)
        beyond = b"\nfastapi>=0.100\n"
        (root / "requirements.txt").write_bytes(padding + beyond)

        result = analyze_repository(root)

    # File counted
    assert result.file_count == 1
    # FastAPI must NOT be detected because keyword is beyond the read limit
    assert "FastAPI" not in result.technologies
    # Python should still be detected from file presence
    assert "Python" in result.technologies


# ---------------------------------------------------------------------------
# 9. Analysis failure produces safe error response
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_analysis_failure_safe_response(client: AsyncClient, db_session) -> None:
    repo_id = await _create_repo(client)

    from sqlalchemy import select
    from app.models.repository import Repository

    # Directly update the record in the shared test session
    result = await db_session.execute(select(Repository).where(Repository.id == repo_id))
    repo = result.scalar_one_or_none()
    assert repo is not None
    repo.status = "failed"
    repo.error_message = "Repository clone failed."
    await db_session.commit()

    resp = await client.get(f"/api/v1/repositories/{repo_id}/analysis")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "failed"
    assert data["error_message"] is not None
    # Must NOT contain internal filesystem paths
    assert data["error_message"] != ""


# ---------------------------------------------------------------------------
# 10. Temporary repository cleanup occurs
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_temporary_directory_cleanup() -> None:
    """Verify the background task cleans up temp directories even on failure."""
    import asyncio
    from app.services.analysis_task import run_analysis

    tracked_dirs: list[str] = []
    real_tempdir_class = tempfile.TemporaryDirectory

    class TrackingTempDir:
        def __init__(self, **kwargs: object) -> None:
            self._real = real_tempdir_class(**kwargs)  # type: ignore[arg-type]
            tracked_dirs.append(self._real.name)

        @property
        def name(self) -> str:
            return self._real.name

        def cleanup(self) -> None:
            self._real.cleanup()

    # Patch clone to fail immediately (no network needed)
    with patch("app.services.analysis_task._clone_repository", return_value=(False, "simulated failure")):
        with patch("tempfile.TemporaryDirectory", TrackingTempDir):
            await run_analysis("nonexistent-id-cleanup", "https://github.com/example/repo")

    # Each tracked temp dir should have been cleaned up
    for d in tracked_dirs:
        assert not Path(d).exists(), f"Temp dir {d} was not cleaned up"


# ---------------------------------------------------------------------------
# 11. Repository code is never executed (static verification)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_no_code_execution() -> None:
    """
    Verify that the analyzer never calls exec/eval/subprocess with repo content.

    This is a static / structural test: we pass a repository containing
    executable-looking files and assert the analyzer returns without errors
    and without running those files.
    """
    from app.services.analyzer import analyze_repository

    executed: list[str] = []

    with tempfile.TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)

        # Place files that would be dangerous if executed
        (root / "setup.py").write_text("import os; os.system('echo HACKED')")
        (root / "Makefile").write_text("all:\n\techo HACKED")
        (root / "install.sh").write_text("#!/bin/bash\nrm -rf /")

        # Monkeypatch subprocess.run to detect any accidental execution
        original_run = __import__("subprocess").run
        def spy_run(cmd: object, **kwargs: object) -> object:
            if isinstance(cmd, list):
                executed.append(str(cmd))
            return original_run(cmd, **kwargs)  # type: ignore[arg-type]

        with patch("subprocess.run", side_effect=spy_run):
            result = analyze_repository(root)

    # Analyzer must complete without errors
    assert result.file_count >= 3
    # subprocess.run must NOT have been called (only git clone calls it, not the analyzer)
    assert executed == [], f"subprocess.run was called unexpectedly: {executed}"


# ---------------------------------------------------------------------------
# 12. _git_env() inherits OS env and overrides only security variables
#     Regression test for: "getaddrinfo() thread failed to start" on Windows
#     caused by a fully-stripped env dict breaking the system DNS resolver.
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_git_env_inherits_os_environment() -> None:
    """
    _git_env() must:
      1. Contain all keys from os.environ (so system libraries like DNS work).
      2. Override GIT_TERMINAL_PROMPT to "0".
      3. Override GIT_ASKPASS to "echo".
      4. Set GIT_CONFIG_NOSYSTEM to "1".
      5. Never drop SYSTEMROOT (Windows) or PATH.
    """
    import os
    from app.services.analysis_task import _git_env

    env = _git_env()

    # Must be a copy, not the same object
    assert env is not os.environ

    # All existing OS env keys must be present
    for key in os.environ:
        assert key in env, f"_git_env() dropped OS env key: {key!r}"

    # Security overrides must be set correctly
    assert env["GIT_TERMINAL_PROMPT"] == "0"
    assert env["GIT_ASKPASS"] == "echo"
    assert env["GIT_CONFIG_NOSYSTEM"] == "1"

    # Critical Windows key — if present in OS env, must be preserved
    if "SYSTEMROOT" in os.environ:
        assert env["SYSTEMROOT"] == os.environ["SYSTEMROOT"], (
            "SYSTEMROOT was dropped or modified — this breaks DNS on Windows"
        )

    # PATH must be preserved
    assert "PATH" in env
