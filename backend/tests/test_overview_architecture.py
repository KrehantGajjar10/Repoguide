"""Chapter 3 tests — overview and architecture endpoints + generators."""
from __future__ import annotations

import json
import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models.repository import Repository


# ---------------------------------------------------------------------------
# Helper: create a fully-analyzed repository in the test DB
# ---------------------------------------------------------------------------

async def _make_analyzed_repo(
    client: AsyncClient,
    db_session,
    url: str = "https://github.com/example/my-app",
    technologies: str = "Python,FastAPI,React,TypeScript,PostgreSQL,Docker",
    top_level_dirs: list | None = None,
    file_count: int = 42,
    directory_count: int = 8,
    default_branch: str = "main",
) -> str:
    resp = await client.post("/api/v1/repositories", json={"url": url})
    assert resp.status_code == 201
    repo_id = resp.json()["id"]

    result = await db_session.execute(select(Repository).where(Repository.id == repo_id))
    repo = result.scalar_one()
    repo.status = "completed"
    repo.technologies = technologies
    repo.top_level_dirs = json.dumps(top_level_dirs or ["frontend", "backend", "tests"])
    repo.file_count = file_count
    repo.directory_count = directory_count
    repo.default_branch = default_branch
    await db_session.commit()
    return repo_id


# ---------------------------------------------------------------------------
# 1. Overview for a normal analyzed repository
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_overview_normal(client: AsyncClient, db_session) -> None:
    repo_id = await _make_analyzed_repo(client, db_session)
    resp = await client.get(f"/api/v1/repositories/{repo_id}/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert data["repository_id"] == repo_id
    assert data["file_count"] == 42
    assert "FastAPI" in data["technologies"] or "Python" in data["technologies"]
    assert data["project_type"] in (
        "full-stack", "frontend", "backend", "mixed/other",
        "library/package", "CLI/tool", "documentation/content", "empty"
    )
    assert len(data["metrics"]) == 4
    assert len(data["tech_stack"]) >= 1
    assert len(data["key_modules"]) >= 1


# ---------------------------------------------------------------------------
# 2. Architecture for a normal analyzed repository
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_architecture_normal(client: AsyncClient, db_session) -> None:
    repo_id = await _make_analyzed_repo(client, db_session)
    resp = await client.get(f"/api/v1/repositories/{repo_id}/architecture")
    assert resp.status_code == 200
    data = resp.json()
    assert data["repository_id"] == repo_id
    # All three views must be present
    assert "nodes" in data
    assert "dataflow_nodes" in data
    assert "deptree_nodes" in data
    assert len(data["nodes"]) >= 1
    assert len(data["dataflow_nodes"]) >= 1
    assert len(data["deptree_nodes"]) >= 1
    # Views must not be identical
    logical_ids = {n["id"] for n in data["nodes"]}
    dataflow_ids = {n["id"] for n in data["dataflow_nodes"]}
    deptree_ids = {n["id"] for n in data["deptree_nodes"]}
    assert logical_ids != dataflow_ids, "Logical and Data Flow views must differ"
    assert logical_ids != deptree_ids, "Logical and Dependency Tree views must differ"
    node = data["nodes"][0]
    assert "id" in node
    assert "name" in node
    assert "type" in node
    assert "purpose" in node


# ---------------------------------------------------------------------------
# 3. Unknown repository → 404
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_overview_unknown_repo(client: AsyncClient) -> None:
    fake = "00000000-0000-0000-0000-000000000000"
    r1 = await client.get(f"/api/v1/repositories/{fake}/overview")
    assert r1.status_code == 404
    r2 = await client.get(f"/api/v1/repositories/{fake}/architecture")
    assert r2.status_code == 404


# ---------------------------------------------------------------------------
# 4. Empty repository → valid minimal overview
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_overview_empty_repo(client: AsyncClient, db_session) -> None:
    repo_id = await _make_analyzed_repo(
        client, db_session,
        url="https://github.com/example/empty-repo",
        technologies="",
        top_level_dirs=[],
        file_count=0,
        directory_count=0,
    )
    resp = await client.get(f"/api/v1/repositories/{repo_id}/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert data["project_type"] == "empty"
    assert data["file_count"] == 0
    assert data["technologies"] == []


# ---------------------------------------------------------------------------
# 5. Frontend-only repository classification
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_classify_frontend_only() -> None:
    from app.services.overview_generator import _classify_project_type
    result = _classify_project_type(
        technologies=["JavaScript / TypeScript", "TypeScript", "React", "Vite"],
        top_level_dirs=["src", "public", "node_modules"],
        file_count=35,
        manifest_hint="",
    )
    assert result == "frontend"


# ---------------------------------------------------------------------------
# 6. Backend-only repository classification
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_classify_backend_only() -> None:
    from app.services.overview_generator import _classify_project_type
    result = _classify_project_type(
        technologies=["Python", "FastAPI", "SQLAlchemy"],
        top_level_dirs=["app", "tests"],
        file_count=20,
        manifest_hint="",
    )
    assert result == "backend"


# ---------------------------------------------------------------------------
# 7. Full-stack repository classification
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_classify_fullstack() -> None:
    from app.services.overview_generator import _classify_project_type
    result = _classify_project_type(
        technologies=["Python", "FastAPI", "React", "TypeScript", "PostgreSQL"],
        top_level_dirs=["frontend", "backend"],
        file_count=80,
        manifest_hint="",
    )
    assert result == "full-stack"


# ---------------------------------------------------------------------------
# 8. Architecture does not invent nonexistent layers
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_architecture_no_invented_layers() -> None:
    from app.services.architecture_generator import generate_architecture

    # Frontend-only: must NOT produce a Database or Backend node
    result = generate_architecture(
        repo_id="test",
        repo_name="spa",
        repo_url="https://github.com/example/spa",
        technologies_csv="JavaScript / TypeScript,TypeScript,React,Vite",
        top_level_dirs_json=json.dumps(["src", "public"]),
        extension_counts_json=json.dumps({".tsx": 20, ".ts": 10}),
        default_branch="main",
        file_count=30,
    )
    node_ids = {n.id for n in result.nodes}
    dataflow_ids = {n.id for n in result.dataflow_nodes}
    assert "database" not in node_ids, "No database node in logical view for frontend-only repo"
    assert "df-db" not in dataflow_ids, "No database node in dataflow view for frontend-only repo"
    # Three views should all exist
    assert len(result.nodes) >= 1
    assert len(result.dataflow_nodes) >= 1
    assert len(result.deptree_nodes) >= 1


# ---------------------------------------------------------------------------
# 9. Analysis-not-completed → 400 with safe message
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_overview_analysis_not_complete(client: AsyncClient, db_session) -> None:
    resp = await client.post("/api/v1/repositories", json={"url": "https://github.com/example/pending"})
    repo_id = resp.json()["id"]
    # status is "created" — not completed
    r = await client.get(f"/api/v1/repositories/{repo_id}/overview")
    assert r.status_code == 400
    detail = r.json()["detail"]
    assert detail["status"] == "error"
    assert "completed" in detail["message"].lower() or "status" in detail["message"].lower()


# ---------------------------------------------------------------------------
# 10. Error responses do not expose internal paths or tracebacks
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_error_responses_safe(client: AsyncClient) -> None:
    fake = "00000000-0000-0000-0000-000000000099"
    for path in [
        f"/api/v1/repositories/{fake}/overview",
        f"/api/v1/repositories/{fake}/architecture",
    ]:
        resp = await client.get(path)
        assert resp.status_code == 404
        body = resp.text
        # Must not contain filesystem paths, tracebacks, or internal details
        assert "Traceback" not in body
        assert "File \"/" not in body
        assert "site-packages" not in body
