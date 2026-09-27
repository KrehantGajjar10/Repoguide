"""
Deterministic architecture generator — three distinct views.

Produces three separate node lists from repository analysis metadata:
  - logical:         major architectural layers/components
  - data_flow:       request/data flow between components
  - dependency_tree: repository directory hierarchy

No code execution, no network calls, no Ollama.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field


@dataclass
class ArchNodeResult:
    id: str
    name: str
    type: str          # client | gateway | service | storage | worker
    badge: str
    sublabel: str
    tech: str
    port: str
    location: str
    files_count: int
    dependencies_count: str
    endpoints_count: str
    purpose: str
    important_files: list[dict]   # [{name, role}]
    ingress: list[str]
    egress: list[dict]            # [{name, note}]
    routes: list[dict]            # [{method, path, action}]
    coords: dict                  # {x, y}


@dataclass
class ArchitectureResult:
    nodes: list[ArchNodeResult] = field(default_factory=list)           # logical view
    dataflow_nodes: list[ArchNodeResult] = field(default_factory=list)  # data flow view
    deptree_nodes: list[ArchNodeResult] = field(default_factory=list)   # dependency tree view
    engine_sync: str = "Structural analysis"
    commit_hash: str = ""


# ---------------------------------------------------------------------------
# Coordinate grids (normalised 0-1, rendered by UI)
# ---------------------------------------------------------------------------
_LOGICAL_COORDS = [
    {"x": 0.5,  "y": 0.08},
    {"x": 0.5,  "y": 0.32},
    {"x": 0.18, "y": 0.60},
    {"x": 0.82, "y": 0.60},
    {"x": 0.5,  "y": 0.82},
    {"x": 0.82, "y": 0.32},
]
_DATAFLOW_COORDS = [
    {"x": 0.5,  "y": 0.08},
    {"x": 0.5,  "y": 0.35},
    {"x": 0.5,  "y": 0.62},
    {"x": 0.5,  "y": 0.85},
    {"x": 0.2,  "y": 0.62},
    {"x": 0.8,  "y": 0.35},
]
_DEPTREE_COORDS = [
    {"x": 0.5,  "y": 0.05},
    {"x": 0.2,  "y": 0.30},
    {"x": 0.5,  "y": 0.30},
    {"x": 0.8,  "y": 0.30},
    {"x": 0.15, "y": 0.60},
    {"x": 0.45, "y": 0.60},
    {"x": 0.75, "y": 0.60},
]


def _c(grid: list[dict], idx: int) -> dict:
    return grid[idx % len(grid)]


# ---------------------------------------------------------------------------
# Tech sets
# ---------------------------------------------------------------------------
_FRONTEND_FW = {
    "React", "Next.js", "Vue", "Nuxt.js", "Angular", "Svelte",
    "Remix", "Astro", "Gatsby", "Vite",
}
_BACKEND_FW = {
    "FastAPI", "Django", "Flask", "Starlette", "Litestar",
    "Express", "Fastify", "Koa", "NestJS",
    "Spring Boot", "Spring", "Ruby on Rails", "Sinatra",
    "Laravel", "Symfony", "Micronaut", "Quarkus",
}
_DB_TECH = {
    "PostgreSQL", "MySQL", "MariaDB", "MongoDB", "Redis",
    "Elasticsearch", "Cassandra", "SQLite",
}
_QUEUE_TECH = {"RabbitMQ", "Kafka", "Celery"}
_INFRA_TECH = {"Docker", "Docker Compose", "Kubernetes", "Helm", "Terraform"}


def _pick_lang(techs: list[str]) -> str:
    for t in techs:
        if t in {"Python", "TypeScript", "JavaScript", "Go", "Rust",
                 "Java", "Kotlin", "Ruby", "PHP", "C#"}:
            return t
    return techs[0] if techs else "Unknown"


# ---------------------------------------------------------------------------
# Helper: build a simple node
# ---------------------------------------------------------------------------

def _node(
    id: str, name: str, type: str, badge: str, sublabel: str, tech: str,
    purpose: str, important_files: list[dict],
    ingress: list[str], egress: list[dict], routes: list[dict],
    coords: dict, port: str = "", location: str = "/",
    files_count: int = 0, deps: str = "—", endpoints: str = "—",
) -> ArchNodeResult:
    return ArchNodeResult(
        id=id, name=name, type=type, badge=badge, sublabel=sublabel,
        tech=tech, port=port, location=location,
        files_count=files_count, dependencies_count=deps,
        endpoints_count=endpoints, purpose=purpose,
        important_files=important_files, ingress=ingress,
        egress=egress, routes=routes, coords=coords,
    )


# ---------------------------------------------------------------------------
# VIEW 1: Logical — major architectural components
# ---------------------------------------------------------------------------

def _build_logical(
    technologies: list[str],
    tech_set: set[str],
    dirs_lower: dict[str, str],
    has_frontend: bool, has_backend: bool, has_db: bool,
    has_queue: bool, has_infra: bool,
    file_count: int, display_name: str,
) -> list[ArchNodeResult]:
    nodes: list[ArchNodeResult] = []
    ci = 0

    if has_frontend:
        fw = next((t for t in technologies if t in _FRONTEND_FW), "Web Frontend")
        lang = "TypeScript" if "TypeScript" in tech_set else "JavaScript"
        fe_files = []
        for f in ["src/", "public/", "package.json", "vite.config.ts", "next.config.js"]:
            base = f.rstrip("/")
            if base.lower() in dirs_lower or f in ["package.json", "vite.config.ts", "next.config.js"]:
                fe_files.append({"name": f, "role": {"src": "Source root", "public": "Static assets",
                    "package.json": "Dependencies", "vite.config.ts": "Build config",
                    "next.config.js": "Framework config"}.get(base, "Config")})
            if len(fe_files) >= 3:
                break
        nodes.append(_node(
            "frontend", "Frontend", "client", "Application", f"{fw} · {lang}", f"{fw} / {lang}",
            f"Client-side application built with {fw}. Renders the UI and communicates with the backend via HTTP.",
            fe_files or [{"name": "src/", "role": "Source root"}],
            ["User / Browser"],
            [{"name": "Backend API", "note": "HTTP/REST"} if has_backend else {"name": "External API", "note": "HTTP"}],
            [], _c(_LOGICAL_COORDS, ci), location=dirs_lower.get("frontend", dirs_lower.get("src", "/")),
            files_count=file_count, deps=str(len([t for t in technologies if t in _FRONTEND_FW])),
        ))
        ci += 1

    if has_backend:
        fw = next((t for t in technologies if t in _BACKEND_FW), None)
        lang = _pick_lang([t for t in technologies if t not in _FRONTEND_FW])
        label = fw or lang or "Backend"
        be_files = []
        for f in ["app/", "main.py", "pyproject.toml", "requirements.txt", "go.mod", "Cargo.toml"]:
            base = f.rstrip("/")
            if base.lower() in dirs_lower or f in ["main.py", "pyproject.toml", "requirements.txt", "go.mod", "Cargo.toml"]:
                be_files.append({"name": f, "role": {"app": "Application package", "main.py": "Entry point",
                    "pyproject.toml": "Manifest", "requirements.txt": "Dependencies",
                    "go.mod": "Go module", "Cargo.toml": "Rust manifest"}.get(base, "Config")})
            if len(be_files) >= 3:
                break
        api_routes = []
        if fw in {"FastAPI", "Flask", "Django", "Express"}:
            api_routes = [
                {"method": "GET",  "path": "/api/v1/...", "action": "Resource retrieval"},
                {"method": "POST", "path": "/api/v1/...", "action": "Resource creation"},
            ]
        egress_be = []
        if has_db:
            egress_be.append({"name": "Database", "note": "SQL / ORM"})
        if has_queue:
            egress_be.append({"name": "Queue", "note": "async tasks"})
        nodes.append(_node(
            "backend", "Backend API" if fw else label, "gateway" if fw else "service",
            "API / Service", f"{label} · {lang}" if fw and fw != lang else label, label,
            f"Server-side application using {label}. Handles business logic and exposes HTTP endpoints.",
            be_files or [{"name": "app/", "role": "Application package"}],
            ["Frontend" if has_frontend else "HTTP clients"],
            egress_be or [{"name": "External services", "note": "HTTP"}],
            api_routes, _c(_LOGICAL_COORDS, ci),
            port="8000" if fw in {"FastAPI", "Flask"} else "",
            location=dirs_lower.get("backend", dirs_lower.get("app", "/")),
            files_count=file_count, endpoints=str(len(api_routes)),
        ))
        ci += 1
    elif not has_frontend:
        # No framework detected — show a single repo node
        lang = _pick_lang(technologies)
        nodes.append(_node(
            "repository", display_name, "service", "Repository", lang, lang,
            f"Repository using {lang}. No specific web framework detected.",
            [], [], [], [], _c(_LOGICAL_COORDS, 0), files_count=file_count,
        ))
        return nodes

    if has_db:
        db_tech = next((t for t in technologies if t in _DB_TECH), "Database")
        orm = "SQLAlchemy" if "SQLAlchemy" in tech_set else "ORM"
        nodes.append(_node(
            "database", "Database", "storage", "Data Store", db_tech, db_tech,
            f"Persistent data storage using {db_tech}. Accessed via {orm}.",
            [{"name": "docker-compose.yml", "role": "Service definition"} if has_infra else {"name": db_tech, "role": "External"}],
            ["Backend API"], [], [], _c(_LOGICAL_COORDS, ci),
            port="5432" if "PostgreSQL" in tech_set else "",
        ))
        ci += 1

    if has_queue:
        q = next((t for t in technologies if t in _QUEUE_TECH), "Queue")
        nodes.append(_node(
            "queue", "Queue Worker", "worker", "Async Task", q, q,
            f"Asynchronous task processing using {q}.",
            [{"name": q, "role": "Message broker"}],
            ["Backend API"], [{"name": "Database", "note": "task results"}],
            [], _c(_LOGICAL_COORDS, ci),
        ))
        ci += 1

    if has_infra and len(nodes) < 5:
        infra = next((t for t in technologies if t in _INFRA_TECH), "Docker")
        nodes.append(_node(
            "infra", "Infrastructure", "worker", "DevOps", infra, infra,
            f"Container and deployment configuration using {infra}.",
            [{"name": "docker-compose.yml", "role": "Orchestration"}],
            [], [], [], _c(_LOGICAL_COORDS, ci),
        ))

    return nodes


# ---------------------------------------------------------------------------
# VIEW 2: Data Flow — how data moves through the system
# ---------------------------------------------------------------------------

def _build_dataflow(
    technologies: list[str],
    tech_set: set[str],
    dirs_lower: dict[str, str],
    has_frontend: bool, has_backend: bool, has_db: bool,
    has_queue: bool, file_count: int, display_name: str,
) -> list[ArchNodeResult]:
    nodes: list[ArchNodeResult] = []
    ci = 0

    if has_frontend and has_backend:
        # Full-stack: User → Frontend → API → Database
        nodes.append(_node(
            "df-user", "User / Browser", "client", "Client", "HTTP Request", "Browser",
            "End user initiates requests from the browser.",
            [], [], [{"name": "Frontend", "note": "renders UI"}], [], _c(_DATAFLOW_COORDS, 0),
        ))
        ci += 1
        fw = next((t for t in technologies if t in _FRONTEND_FW), "Frontend")
        nodes.append(_node(
            "df-frontend", "Frontend App", "client", "SPA", fw, fw,
            f"Single-page application built with {fw}. Sends HTTP requests to the backend API.",
            [{"name": "src/", "role": "Source root"}],
            ["User / Browser"], [{"name": "Backend API", "note": "REST/HTTP"}],
            [], _c(_DATAFLOW_COORDS, 1),
        ))
        ci += 1
        bw = next((t for t in technologies if t in _BACKEND_FW), "API")
        nodes.append(_node(
            "df-api", "Backend API", "gateway", "API Layer", bw, bw,
            f"HTTP API built with {bw}. Validates requests, applies business logic, and queries the database.",
            [{"name": "app/", "role": "Application package"}],
            ["Frontend App"], [{"name": "Data Store", "note": "SQL / ORM"} if has_db else {"name": "External", "note": "HTTP"}],
            [{"method": "GET", "path": "/api/...", "action": "Read"}, {"method": "POST", "path": "/api/...", "action": "Write"}],
            _c(_DATAFLOW_COORDS, 2),
        ))
        ci += 1
        if has_db:
            db = next((t for t in technologies if t in _DB_TECH), "Database")
            nodes.append(_node(
                "df-db", "Data Store", "storage", "Database", db, db,
                f"Persistent storage layer using {db}. Reads and writes are mediated by the backend ORM.",
                [], ["Backend API"], [], [], _c(_DATAFLOW_COORDS, 3),
            ))
        if has_queue:
            q = next((t for t in technologies if t in _QUEUE_TECH), "Queue")
            nodes.append(_node(
                "df-queue", "Task Queue", "worker", "Async", q, q,
                f"Asynchronous task queue using {q}. Receives jobs from the backend API.",
                [], ["Backend API"], [{"name": "Data Store", "note": "results"}],
                [], _c(_DATAFLOW_COORDS, 4),
            ))

    elif has_frontend and not has_backend:
        # Frontend-only: User → Component Tree → State → API Call
        fw = next((t for t in technologies if t in _FRONTEND_FW), "Frontend")
        nodes.append(_node(
            "df-user", "User / Browser", "client", "Client", "Interaction", "Browser",
            "End user interacts with the UI.",
            [], [], [{"name": "UI Components", "note": "renders"}], [], _c(_DATAFLOW_COORDS, 0),
        ))
        nodes.append(_node(
            "df-components", "UI Components", "client", "View Layer", fw, fw,
            f"React component tree built with {fw}. Handles user events and renders state.",
            [{"name": "src/", "role": "Components"}],
            ["User / Browser"], [{"name": "Application State", "note": "updates"}],
            [], _c(_DATAFLOW_COORDS, 1),
        ))
        nodes.append(_node(
            "df-state", "Application State", "service", "State", "Local state", "State management",
            "Client-side state management. Drives UI re-renders.",
            [], ["UI Components"], [{"name": "External API", "note": "HTTP fetch"}],
            [], _c(_DATAFLOW_COORDS, 2),
        ))
        nodes.append(_node(
            "df-api-call", "External API", "gateway", "Remote", "HTTP/REST", "Fetch / XHR",
            "External HTTP API calls from the frontend. Data returned to state.",
            [], ["Application State"], [], [], _c(_DATAFLOW_COORDS, 3),
        ))

    elif has_backend and not has_frontend:
        # Backend-only: Client → API → Service → DB
        bw = next((t for t in technologies if t in _BACKEND_FW), "API")
        nodes.append(_node(
            "df-client", "HTTP Client", "client", "Client", "Request", "HTTP/REST",
            "Any HTTP client sending requests to this API.",
            [], [], [{"name": "API Layer", "note": "HTTP request"}], [], _c(_DATAFLOW_COORDS, 0),
        ))
        nodes.append(_node(
            "df-api", "API Layer", "gateway", "Router", bw, bw,
            f"HTTP request routing and schema validation using {bw}.",
            [{"name": "app/", "role": "Route handlers"}],
            ["HTTP Client"], [{"name": "Service Layer", "note": "business logic"}],
            [{"method": "GET", "path": "/...", "action": "Read"}, {"method": "POST", "path": "/...", "action": "Write"}],
            _c(_DATAFLOW_COORDS, 1),
        ))
        nodes.append(_node(
            "df-service", "Service Layer", "service", "Business Logic", "Python", "Service functions",
            "Business logic layer. Validates data, applies rules, and interacts with the database.",
            [{"name": "services/", "role": "Business logic"}],
            ["API Layer"], [{"name": "Data Store", "note": "ORM queries"} if has_db else {"name": "External", "note": "HTTP"}],
            [], _c(_DATAFLOW_COORDS, 2),
        ))
        if has_db:
            db = next((t for t in technologies if t in _DB_TECH), "Database")
            nodes.append(_node(
                "df-db", "Data Store", "storage", "Database", db, db,
                f"Persistent storage using {db}.",
                [], ["Service Layer"], [], [], _c(_DATAFLOW_COORDS, 3),
            ))
    else:
        # Fallback
        lang = _pick_lang(technologies)
        nodes.append(_node(
            "df-repo", display_name, "service", "Repository", lang, lang,
            f"Repository using {lang}. Insufficient structural information for a data flow diagram.",
            [], [], [], [], _c(_DATAFLOW_COORDS, 0), files_count=file_count,
        ))

    return nodes


# ---------------------------------------------------------------------------
# VIEW 3: Dependency Tree — directory/module hierarchy
# ---------------------------------------------------------------------------

def _build_deptree(
    technologies: list[str],
    tech_set: set[str],
    top_level_dirs: list[str],
    file_count: int,
    display_name: str,
) -> list[ArchNodeResult]:
    nodes: list[ArchNodeResult] = []
    ci = 0

    if not top_level_dirs and not technologies:
        nodes.append(_node(
            "dt-root", display_name, "service", "Root", "Empty", "No files",
            "Empty or minimal repository.",
            [], [], [], [], _c(_DEPTREE_COORDS, 0),
        ))
        return nodes

    # Root node
    nodes.append(_node(
        "dt-root", f"{display_name}/", "gateway", "Root", display_name, "Repository root",
        f"Repository root. Contains {len(top_level_dirs)} top-level directories and {file_count} total files.",
        [{"name": d + "/", "role": "Top-level directory"} for d in top_level_dirs[:4]],
        [], [{"name": d + "/", "note": "subdirectory"} for d in top_level_dirs[:4]],
        [], _c(_DEPTREE_COORDS, 0), files_count=file_count,
    ))
    ci += 1

    # One node per top-level directory (up to 6)
    for d in top_level_dirs[:6]:
        d_lower = d.lower()
        # Determine node type from directory name
        if d_lower in {"frontend", "client", "web", "ui", "src", "public"}:
            ntype, badge = "client", "Frontend"
        elif d_lower in {"backend", "server", "api", "app", "src", "lib"}:
            ntype, badge = "service", "Backend"
        elif d_lower in {"tests", "test", "__tests__", "spec"}:
            ntype, badge = "worker", "Tests"
        elif d_lower in {"docs", "documentation"}:
            ntype, badge = "worker", "Docs"
        elif d_lower in {"infra", "docker", ".github", "deploy", "k8s"}:
            ntype, badge = "worker", "Infra"
        else:
            ntype, badge = "service", "Module"

        # Tech label for the dir
        tech_label = ", ".join(technologies[:2]) if technologies else d

        nodes.append(_node(
            f"dt-{d}", f"{d}/", ntype, badge, d, tech_label,
            f"Directory: {d}/. Part of the {display_name} repository structure.",
            [{"name": f"{d}/", "role": "Directory"}],
            [f"{display_name}/"], [],
            [], _c(_DEPTREE_COORDS, ci), location=d + "/",
        ))
        ci += 1

    return nodes


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_architecture(
    repo_id: str,
    repo_name: str | None,
    repo_url: str,
    technologies_csv: str | None,
    top_level_dirs_json: str | None,
    extension_counts_json: str | None,
    default_branch: str | None,
    file_count: int | None,
) -> ArchitectureResult:
    """
    Build an ArchitectureResult with three separate node lists.
    Pure function — no I/O, no code execution.
    """
    technologies: list[str] = []
    if technologies_csv:
        technologies = [t.strip() for t in technologies_csv.split(",") if t.strip()]

    top_level_dirs: list[str] = []
    if top_level_dirs_json:
        try:
            top_level_dirs = json.loads(top_level_dirs_json)
        except (json.JSONDecodeError, TypeError):
            pass

    tech_set = set(technologies)
    dirs_lower = {d.lower(): d for d in top_level_dirs}

    has_frontend = bool(tech_set & _FRONTEND_FW) or "src" in dirs_lower or "public" in dirs_lower
    has_backend = bool(tech_set & _BACKEND_FW) or "Python" in tech_set or "Go" in tech_set
    has_db = bool(tech_set & _DB_TECH)
    has_queue = bool(tech_set & _QUEUE_TECH)
    has_infra = bool(tech_set & _INFRA_TECH)
    fc = file_count or 0

    display_name = repo_name or (repo_url.rstrip("/").split("/")[-1] if repo_url else "Repository")

    logical = _build_logical(
        technologies, tech_set, dirs_lower,
        has_frontend, has_backend, has_db, has_queue, has_infra, fc, display_name,
    )
    dataflow = _build_dataflow(
        technologies, tech_set, dirs_lower,
        has_frontend, has_backend, has_db, has_queue, fc, display_name,
    )
    deptree = _build_deptree(
        technologies, tech_set, top_level_dirs, fc, display_name,
    )

    return ArchitectureResult(
        nodes=logical,
        dataflow_nodes=dataflow,
        deptree_nodes=deptree,
        engine_sync="Structural analysis · no AI",
        commit_hash=default_branch or "HEAD",
    )
