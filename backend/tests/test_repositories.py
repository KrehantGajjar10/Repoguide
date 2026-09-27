import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# 1. Health endpoint
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_health(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# 2. Create repository — happy path
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_create_repository(client: AsyncClient) -> None:
    payload = {"url": "https://github.com/example/campus-connect"}
    response = await client.post("/api/v1/repositories", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["url"] == "https://github.com/example/campus-connect"
    assert data["name"] == "example/campus-connect"
    assert data["status"] == "created"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


# ---------------------------------------------------------------------------
# 3. Retrieve repository
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_get_repository(client: AsyncClient) -> None:
    # First create
    payload = {"url": "https://github.com/org/my-service"}
    create_response = await client.post("/api/v1/repositories", json=payload)
    assert create_response.status_code == 201
    repo_id = create_response.json()["id"]

    # Then retrieve
    get_response = await client.get(f"/api/v1/repositories/{repo_id}")
    assert get_response.status_code == 200
    data = get_response.json()
    assert data["id"] == repo_id
    assert data["url"] == "https://github.com/org/my-service"
    assert data["status"] == "created"


# ---------------------------------------------------------------------------
# 4. Invalid repository URL
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_create_repository_invalid_url(client: AsyncClient) -> None:
    bad_payloads = [
        {"url": "not-a-url"},
        {"url": "https://gitlab.com/example/repo"},
        {"url": "http://github.com/example/repo"},   # http, not https
        {"url": "https://github.com/onlyowner"},
    ]
    for payload in bad_payloads:
        response = await client.post("/api/v1/repositories", json=payload)
        assert response.status_code == 422, (
            f"Expected 422 for payload {payload}, got {response.status_code}"
        )


# ---------------------------------------------------------------------------
# 5. Nonexistent repository ID
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_get_repository_not_found(client: AsyncClient) -> None:
    response = await client.get("/api/v1/repositories/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
    data = response.json()
    # FastAPI wraps detail in {"detail": ...}
    assert "detail" in data
    assert data["detail"]["status"] == "error"
