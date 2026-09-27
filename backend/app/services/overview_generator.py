"""
Deterministic project overview generator.

Produces a structured overview from the analysis metadata already stored in
the Repository record (Chapter 2).  No code execution, no network calls,
no Ollama.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class ProjectOverviewResult:
    project_type: str = "mixed/other"          # frontend|backend|full-stack|library/package|CLI/tool|documentation|empty|mixed/other
    description: str = ""
    # tech groups: {"Frontend": [...], "Backend": [...], "Infrastructure": [...], "Tooling": [...]}
    tech_groups: dict[str, list[str]] = field(default_factory=dict)
    # architecture layers for the 4-card summary strip
    architecture_layers: list[dict] = field(default_factory=list)
    # key module entries: {id, name, path, description}
    key_modules: list[dict] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Technology → category mapping (deterministic)
# ---------------------------------------------------------------------------

_FRONTEND_TECHS = {
    "React", "Next.js", "Vue", "Nuxt.js", "Angular", "Svelte", "Remix",
    "Astro", "Gatsby", "TypeScript", "JavaScript", "Vite", "Electron",
    "JavaScript / TypeScript",
}
_BACKEND_TECHS = {
    "Python", "FastAPI", "Django", "Flask", "Starlette", "Litestar",
    "Go", "Rust", "Java", "Java / Maven", "Java / Gradle",
    "Kotlin", "Kotlin / Gradle", "Spring Boot", "Spring",
    "Ruby", "Ruby on Rails", "Sinatra",
    "PHP", "Laravel", "Symfony",
    "C#", ".NET", "Express", "Fastify", "Koa", "NestJS",
    "C", "C++", "C/C++", "Elixir", "Haskell", "Scala",
    "Python", "SQLAlchemy", "Alembic", "Celery",
}
_DB_TECHS = {
    "PostgreSQL", "MySQL", "MariaDB", "MongoDB", "Redis",
    "Elasticsearch", "Cassandra", "RabbitMQ", "Kafka", "SQLite",
}
_INFRA_TECHS = {
    "Docker", "Docker Compose", "Kubernetes", "Helm",
    "Terraform", "GitHub Actions", "Jenkins", "Travis CI", "CircleCI",
    "Shell", "PowerShell",
}
_LANG_ONLY = {
    "TypeScript", "JavaScript", "Python", "Go", "Rust", "Java",
    "Kotlin", "Ruby", "PHP", "C#", "C", "C++", "C/C++",
    "Elixir", "Haskell", "Scala", "Dart", "Swift", "Julia",
    "R", "Lua", "SQL", "YAML",
}


def _categorise_tech(tech: str) -> str:
    if tech in _FRONTEND_TECHS:
        return "Frontend"
    if tech in _BACKEND_TECHS:
        return "Backend"
    if tech in _DB_TECHS:
        return "Database"
    if tech in _INFRA_TECHS:
        return "Infrastructure"
    return "Tooling"


# ---------------------------------------------------------------------------
# Project type classification
# ---------------------------------------------------------------------------

def _classify_project_type(
    technologies: list[str],
    top_level_dirs: list[str],
    file_count: int,
    manifest_hint: str,   # comma-sep techs string from DB
) -> str:
    if file_count == 0:
        return "empty"

    techs = set(technologies)
    dirs_lower = {d.lower() for d in top_level_dirs}

    has_frontend = bool(techs & _FRONTEND_TECHS)
    has_backend = bool(techs & (_BACKEND_TECHS - _LANG_ONLY))  # framework required
    has_python = "Python" in techs
    has_js_ts = bool(techs & {"JavaScript", "TypeScript", "JavaScript / TypeScript"})

    # Full-stack: meaningful frontend framework + meaningful backend framework
    if has_frontend and has_backend:
        return "full-stack"

    # Frontend-only
    if has_frontend and not has_backend:
        # must have at least a JS/TS framework beyond bare TS/JS
        framework_set = techs & (_FRONTEND_TECHS - {"TypeScript", "JavaScript", "JavaScript / TypeScript"})
        if framework_set or "src" in dirs_lower or "public" in dirs_lower:
            return "frontend"

    # Backend-only
    if has_backend and not has_frontend:
        return "backend"

    # Python project without a web framework
    if has_python and not has_frontend:
        # CLI tool heuristic: no web dirs, small
        web_dirs = {"api", "routes", "views", "templates", "static", "app"}
        if not (dirs_lower & web_dirs) and file_count < 50:
            return "CLI/tool"
        return "backend"

    # Pure JS/TS without a framework — likely a library
    if has_js_ts and not has_frontend and not has_backend:
        if "src" in dirs_lower or "lib" in dirs_lower:
            return "library/package"

    # Documentation / content heavy
    md_hint = manifest_hint.lower()
    if ".md" in md_hint or "docs" in dirs_lower or "content" in dirs_lower:
        doc_dirs = {"docs", "documentation", "content", "wiki", "pages"}
        if dirs_lower & doc_dirs and file_count < 100:
            return "documentation/content"

    # Go / Rust / compiled — usually library or CLI
    if techs & {"Go", "Rust", "C", "C++", "C/C++"}:
        if not has_frontend and not has_backend:
            return "library/package"

    return "mixed/other"


# ---------------------------------------------------------------------------
# Description builder
# ---------------------------------------------------------------------------

def _build_description(
    project_type: str,
    technologies: list[str],
    file_count: int,
    directory_count: int,
    top_level_dirs: list[str],
    repo_name: str,
) -> str:
    tech_str = ", ".join(technologies[:5]) if technologies else "unknown technologies"
    dirs_str = ", ".join(f"{d}/" for d in top_level_dirs[:4]) if top_level_dirs else "no top-level directories"

    type_phrases = {
        "empty": f"{repo_name} is an empty repository with no committed files.",
        "frontend": (
            f"{repo_name} is a frontend application built with {tech_str}. "
            f"It contains {file_count} files across {directory_count} directories, "
            f"with top-level structure: {dirs_str}."
        ),
        "backend": (
            f"{repo_name} is a backend service built with {tech_str}. "
            f"It contains {file_count} files across {directory_count} directories, "
            f"with top-level structure: {dirs_str}."
        ),
        "full-stack": (
            f"{repo_name} is a full-stack application using {tech_str}. "
            f"It contains {file_count} files across {directory_count} directories, "
            f"with top-level structure: {dirs_str}."
        ),
        "library/package": (
            f"{repo_name} is a library or package using {tech_str}. "
            f"It contains {file_count} files across {directory_count} directories."
        ),
        "CLI/tool": (
            f"{repo_name} is a CLI tool or utility written in {tech_str}. "
            f"It contains {file_count} files across {directory_count} directories."
        ),
        "documentation/content": (
            f"{repo_name} is a documentation or content repository. "
            f"It contains {file_count} files across {directory_count} directories."
        ),
    }
    return type_phrases.get(
        project_type,
        (
            f"{repo_name} contains {file_count} files across {directory_count} directories "
            f"using {tech_str}."
        ),
    )


# ---------------------------------------------------------------------------
# Architecture layers (4-card summary strip on overview page)
# ---------------------------------------------------------------------------

_LAYER_ICONS = {
    "Frontend": "devices",
    "Backend": "route",
    "Infrastructure": "hub",
    "Database": "database",
    "Tooling": "hub",
    "Configuration": "hub",
}

_LAYER_STEPS = ["01", "02", "03", "04"]


def _build_architecture_layers(
    tech_groups: dict[str, list[str]],
    top_level_dirs: list[str],
) -> list[dict]:
    layers: list[dict] = []
    step_idx = 0

    # Determine order: Frontend → Backend → Database → Infrastructure
    order = ["Frontend", "Backend", "Database", "Infrastructure", "Tooling"]
    for category in order:
        items = tech_groups.get(category, [])
        if not items:
            continue
        tech_label = ", ".join(items[:3])
        # Pick a runtime label
        runtime_map = {
            "Frontend": "Browser / Node",
            "Backend": "Server",
            "Database": "Persistent store",
            "Infrastructure": "DevOps",
            "Tooling": "Build / CI",
        }
        layers.append({
            "step": _LAYER_STEPS[step_idx % 4],
            "name": category,
            "tech": tech_label,
            "runtime": runtime_map.get(category, "Runtime"),
            "port": "",
            "icon": _LAYER_ICONS.get(category, "hub"),
        })
        step_idx += 1
        if step_idx >= 4:
            break

    # If fewer than 2 layers, add a generic Configuration layer
    if len(layers) < 2 and top_level_dirs:
        layers.append({
            "step": _LAYER_STEPS[len(layers)],
            "name": "Configuration",
            "tech": ", ".join(top_level_dirs[:3]),
            "runtime": "Project root",
            "port": "",
            "icon": "hub",
        })

    return layers[:4]


# ---------------------------------------------------------------------------
# Key modules (derived from top-level dirs + manifest files)
# ---------------------------------------------------------------------------

_DIR_DESCRIPTIONS: dict[str, str] = {
    "src": "Primary source code directory",
    "app": "Application entry point and core modules",
    "frontend": "Client-side application",
    "backend": "Server-side application",
    "lib": "Shared library code",
    "api": "API route definitions",
    "services": "Business logic and service layer",
    "models": "Data models and schema definitions",
    "components": "UI component library",
    "pages": "Page-level React components",
    "tests": "Automated test suite",
    "test": "Automated test suite",
    "docs": "Project documentation",
    "scripts": "Utility and automation scripts",
    "config": "Configuration files",
    "public": "Static public assets",
    "static": "Static assets",
    "utils": "Shared utility functions",
    "core": "Core framework code",
    "handlers": "Request/event handlers",
    "routes": "Route definitions",
    "middleware": "Middleware modules",
    "migrations": "Database migrations",
    "schemas": "Validation schemas",
}


def _build_key_modules(
    top_level_dirs: list[str],
    manifest_files: list[str],
) -> list[dict]:
    modules: list[dict] = []
    seen: set[str] = set()

    for d in top_level_dirs[:8]:
        desc = _DIR_DESCRIPTIONS.get(d.lower(), f"{d}/ directory")
        modules.append({
            "id": f"dir-{d}",
            "name": d,
            "path": f"{d}/",
            "description": desc,
        })
        seen.add(d)

    # Add interesting manifest files as modules
    important_manifests = [
        "package.json", "pyproject.toml", "requirements.txt",
        "go.mod", "Cargo.toml", "pom.xml", "Gemfile",
        "docker-compose.yml", "Dockerfile",
    ]
    for mf in manifest_files:
        basename = mf.replace("\\", "/").split("/")[-1]
        if basename in important_manifests and basename not in seen:
            desc_map = {
                "package.json": "Node.js project manifest and dependency list",
                "pyproject.toml": "Python project configuration and dependencies",
                "requirements.txt": "Python package dependency list",
                "go.mod": "Go module definition",
                "Cargo.toml": "Rust crate manifest",
                "pom.xml": "Maven project descriptor",
                "Gemfile": "Ruby gem dependencies",
                "docker-compose.yml": "Docker Compose service definitions",
                "Dockerfile": "Container build instructions",
            }
            modules.append({
                "id": f"file-{basename}",
                "name": basename,
                "path": basename,
                "description": desc_map.get(basename, "Project configuration file"),
            })
            seen.add(basename)

    return modules[:8]


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_overview(
    repo_id: str,
    repo_name: str | None,
    repo_url: str,
    status: str,
    file_count: int | None,
    directory_count: int | None,
    technologies_csv: str | None,
    top_level_dirs_json: str | None,
    extension_counts_json: str | None,
    manifest_files_csv: str | None,
    default_branch: str | None,
) -> ProjectOverviewResult:
    """
    Build a ProjectOverviewResult from repository analysis metadata.
    Pure function — no I/O, no code execution.
    """
    file_count = file_count or 0
    directory_count = directory_count or 0
    technologies: list[str] = []
    if technologies_csv:
        technologies = [t.strip() for t in technologies_csv.split(",") if t.strip()]

    top_level_dirs: list[str] = []
    if top_level_dirs_json:
        try:
            top_level_dirs = json.loads(top_level_dirs_json)
        except (json.JSONDecodeError, TypeError):
            pass

    manifest_files: list[str] = []
    if manifest_files_csv:
        manifest_files = [m.strip() for m in manifest_files_csv.split(",") if m.strip()]

    display_name = repo_name or (repo_url.rstrip("/").split("/")[-1] if repo_url else "Repository")

    # Classify
    project_type = _classify_project_type(
        technologies, top_level_dirs, file_count, technologies_csv or ""
    )

    # Tech groups
    tech_groups: dict[str, list[str]] = {}
    for tech in technologies:
        cat = _categorise_tech(tech)
        tech_groups.setdefault(cat, [])
        if tech not in tech_groups[cat]:
            tech_groups[cat].append(tech)

    # Description
    description = _build_description(
        project_type, technologies, file_count, directory_count, top_level_dirs, display_name
    )

    # Architecture layers
    architecture_layers = _build_architecture_layers(tech_groups, top_level_dirs)

    # Key modules
    key_modules = _build_key_modules(top_level_dirs, manifest_files)

    return ProjectOverviewResult(
        project_type=project_type,
        description=description,
        tech_groups=tech_groups,
        architecture_layers=architecture_layers,
        key_modules=key_modules,
    )
