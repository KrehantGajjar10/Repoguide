"""Pydantic schemas for Project Overview and Architecture Explorer endpoints."""
from __future__ import annotations

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Shared sub-types
# ---------------------------------------------------------------------------

class ArchitectureLayerSchema(BaseModel):
    step: str
    name: str
    tech: str
    runtime: str
    port: str
    icon: str


class KeyModuleSchema(BaseModel):
    id: str
    name: str
    path: str
    description: str


class TechGroupSchema(BaseModel):
    category: str
    icon: str          # frontend | backend | database | tooling
    items: list[str]


# ---------------------------------------------------------------------------
# Project Overview
# ---------------------------------------------------------------------------

_CAT_ICON_MAP = {
    "Frontend": "frontend",
    "Backend": "backend",
    "Database": "database",
    "Infrastructure": "tooling",
    "Tooling": "tooling",
}


class ProjectOverviewResponse(BaseModel):
    repository_id: str
    repository_name: str
    repository_url: str
    default_branch: str | None
    status: str
    project_type: str
    description: str
    file_count: int
    directory_count: int
    technologies: list[str]
    commit_hash: str          # branch name used as commit ref for UI
    top_level_dirs: list[str]  # actual top-level directories from analysis
    # UI-shaped fields
    metrics: list[dict]
    architecture_layers: list[ArchitectureLayerSchema]
    tech_stack: list[TechGroupSchema]
    key_modules: list[KeyModuleSchema]


def build_overview_response(
    repo,                  # Repository ORM object
    result,                # ProjectOverviewResult
) -> ProjectOverviewResponse:
    from app.services.overview_generator import ProjectOverviewResult
    assert isinstance(result, ProjectOverviewResult)

    technologies: list[str] = []
    if repo.technologies:
        technologies = [t.strip() for t in repo.technologies.split(",") if t.strip()]

    file_count: int = repo.file_count or 0
    dir_count: int = repo.directory_count or 0

    # 4 metric cards matching the UI type { id, label, value, detail, icon }
    metrics = [
        {"id": "m1", "label": "Files",        "value": file_count,  "detail": f"{dir_count} directories", "icon": "modules"},
        {"id": "m2", "label": "Technologies", "value": len(technologies), "detail": result.project_type,    "icon": "dependencies"},
        {"id": "m3", "label": "Branch",       "value": repo.default_branch or "—", "detail": "default branch",  "icon": "routes"},
        {"id": "m4", "label": "Type",         "value": result.project_type.replace("/", " / "),
         "detail": "project classification", "icon": "models"},
    ]

    tech_stack = [
        TechGroupSchema(
            category=cat,
            icon=_CAT_ICON_MAP.get(cat, "tooling"),
            items=items,
        )
        for cat, items in result.tech_groups.items()
    ]

    architecture_layers = [
        ArchitectureLayerSchema(**layer)
        for layer in result.architecture_layers
    ]

    key_modules = [
        KeyModuleSchema(**mod)
        for mod in result.key_modules
    ]

    import json as _json
    top_level_dirs: list[str] = []
    if repo.top_level_dirs:
        try:
            top_level_dirs = _json.loads(repo.top_level_dirs)
        except Exception:
            pass

    return ProjectOverviewResponse(
        repository_id=repo.id,
        repository_name=repo.name or repo.url.rstrip("/").split("/")[-1],
        repository_url=repo.url,
        default_branch=repo.default_branch,
        status=repo.status,
        project_type=result.project_type,
        description=result.description,
        file_count=file_count,
        directory_count=dir_count,
        technologies=technologies,
        commit_hash=repo.default_branch or "HEAD",
        top_level_dirs=top_level_dirs,
        metrics=metrics,
        architecture_layers=architecture_layers,
        tech_stack=tech_stack,
        key_modules=key_modules,
    )


# ---------------------------------------------------------------------------
# Architecture Explorer
# ---------------------------------------------------------------------------

class ArchitectureNodeSchema(BaseModel):
    id: str
    name: str
    type: str
    badge: str
    sublabel: str
    tech: str
    port: str
    location: str
    filesCount: int
    dependenciesCount: str
    endpointsCount: str
    purpose: str
    importantFiles: list[dict]
    ingress: list[str]
    egress: list[dict]
    routes: list[dict]
    coords: dict


class ArchitectureResponse(BaseModel):
    repository_id: str
    repository_name: str
    repository_url: str
    default_branch: str | None
    engine_sync: str
    commit_hash: str
    nodes: list[ArchitectureNodeSchema]              # logical view
    dataflow_nodes: list[ArchitectureNodeSchema]     # data flow view
    deptree_nodes: list[ArchitectureNodeSchema]      # dependency tree view


def _map_nodes(node_list) -> list[ArchitectureNodeSchema]:
    return [
        ArchitectureNodeSchema(
            id=n.id, name=n.name, type=n.type, badge=n.badge, sublabel=n.sublabel,
            tech=n.tech, port=n.port, location=n.location,
            filesCount=n.files_count, dependenciesCount=n.dependencies_count,
            endpointsCount=n.endpoints_count, purpose=n.purpose,
            importantFiles=n.important_files, ingress=n.ingress,
            egress=n.egress, routes=n.routes, coords=n.coords,
        )
        for n in node_list
    ]


def build_architecture_response(
    repo,
    result,
) -> ArchitectureResponse:
    from app.services.architecture_generator import ArchitectureResult
    assert isinstance(result, ArchitectureResult)

    return ArchitectureResponse(
        repository_id=repo.id,
        repository_name=repo.name or repo.url.rstrip("/").split("/")[-1],
        repository_url=repo.url,
        default_branch=repo.default_branch,
        engine_sync=result.engine_sync,
        commit_hash=result.commit_hash,
        nodes=_map_nodes(result.nodes),
        dataflow_nodes=_map_nodes(result.dataflow_nodes),
        deptree_nodes=_map_nodes(result.deptree_nodes),
    )
