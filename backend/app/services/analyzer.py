"""
Structural repository analyzer.

Inspects a cloned repository directory as data only.
Never executes any repository code, scripts, or binaries.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING

from app.core.analysis_config import (
    BINARY_EXTENSIONS,
    IGNORED_DIRS,
    MAX_FILE_READ_BYTES,
    MAX_FILES_INSPECTED,
)

if TYPE_CHECKING:
    pass


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class StructuralAnalysisResult:
    file_count: int = 0
    directory_count: int = 0
    # extension → count  (e.g. {".py": 12, ".ts": 8})
    extension_counts: dict[str, int] = field(default_factory=dict)
    # names of immediate children of the repo root that are directories
    top_level_dirs: list[str] = field(default_factory=list)
    # detected technology/framework labels  (ordered, deduplicated)
    technologies: list[str] = field(default_factory=list)
    # manifest / config files found (relative paths)
    manifest_files: list[str] = field(default_factory=list)
    # True when the walk was truncated by MAX_FILES_INSPECTED
    truncated: bool = False


# ---------------------------------------------------------------------------
# Technology detection rules
# Key: filename or extension pattern  →  value: list[str] of tech labels
# Rules are checked deterministically; no source-code text scanning.
# ---------------------------------------------------------------------------

# Files whose PRESENCE (anywhere in the tree) implies a technology
_FILE_PRESENCE_RULES: dict[str, list[str]] = {
    # JavaScript / TypeScript ecosystem
    "package.json": ["JavaScript / TypeScript"],
    "tsconfig.json": ["TypeScript"],
    "vite.config.ts": ["Vite"],
    "vite.config.js": ["Vite"],
    "vite.config.mjs": ["Vite"],
    "next.config.js": ["Next.js"],
    "next.config.ts": ["Next.js"],
    "next.config.mjs": ["Next.js"],
    "angular.json": ["Angular"],
    "nuxt.config.ts": ["Nuxt.js"],
    "nuxt.config.js": ["Nuxt.js"],
    "svelte.config.js": ["Svelte"],
    "remix.config.js": ["Remix"],
    "astro.config.mjs": ["Astro"],
    "astro.config.ts": ["Astro"],
    "gatsby-config.js": ["Gatsby"],
    "gatsby-config.ts": ["Gatsby"],
    # Python
    "requirements.txt": ["Python"],
    "pyproject.toml": ["Python"],
    "setup.py": ["Python"],
    "setup.cfg": ["Python"],
    "Pipfile": ["Python"],
    "manage.py": ["Django"],
    # Go
    "go.mod": ["Go"],
    # Rust
    "Cargo.toml": ["Rust"],
    # Java / Kotlin / JVM
    "pom.xml": ["Java / Maven"],
    "build.gradle": ["Java / Gradle"],
    "build.gradle.kts": ["Kotlin / Gradle"],
    "gradlew": ["Java / Gradle"],
    # PHP
    "composer.json": ["PHP"],
    # Ruby
    "Gemfile": ["Ruby"],
    # .NET
    "global.json": [".NET"],
    # Docker / infra
    "Dockerfile": ["Docker"],
    "docker-compose.yml": ["Docker Compose"],
    "docker-compose.yaml": ["Docker Compose"],
    ".dockerignore": ["Docker"],
    # CI
    ".github": ["GitHub Actions"],   # checked as a directory name
    "Jenkinsfile": ["Jenkins"],
    ".travis.yml": ["Travis CI"],
    ".circleci": ["CircleCI"],
    # Infrastructure
    "terraform.tf": ["Terraform"],
    "main.tf": ["Terraform"],
    "kubernetes": ["Kubernetes"],
    "k8s": ["Kubernetes"],
    "Chart.yaml": ["Helm"],
}

# Files where we must also READ content (only first MAX_FILE_READ_BYTES)
# to confirm a framework label.  Each entry maps:
#   filename → list of (search_string, label) pairs
_FILE_CONTENT_RULES: dict[str, list[tuple[str, str]]] = {
    "package.json": [
        ('"react"', "React"),
        ('"react-dom"', "React"),
        ('"next"', "Next.js"),
        ('"vue"', "Vue"),
        ('"@angular/core"', "Angular"),
        ('"svelte"', "Svelte"),
        ('"express"', "Express"),
        ('"fastify"', "Fastify"),
        ('"koa"', "Koa"),
        ('"@nestjs/core"', "NestJS"),
        ('"electron"', "Electron"),
    ],
    "pyproject.toml": [
        ("fastapi", "FastAPI"),
        ("django", "Django"),
        ("flask", "Flask"),
        ("starlette", "Starlette"),
        ("litestar", "Litestar"),
        ("sqlalchemy", "SQLAlchemy"),
        ("alembic", "Alembic"),
        ("celery", "Celery"),
    ],
    "requirements.txt": [
        ("fastapi", "FastAPI"),
        ("django", "Django"),
        ("flask", "Flask"),
        ("starlette", "Starlette"),
        ("sqlalchemy", "SQLAlchemy"),
        ("celery", "Celery"),
        ("pandas", "Pandas"),
        ("numpy", "NumPy"),
        ("torch", "PyTorch"),
        ("tensorflow", "TensorFlow"),
        ("scikit-learn", "scikit-learn"),
    ],
    "pom.xml": [
        ("spring-boot", "Spring Boot"),
        ("spring-web", "Spring"),
        ("micronaut", "Micronaut"),
        ("quarkus", "Quarkus"),
    ],
    "build.gradle": [
        ("spring-boot", "Spring Boot"),
        ("org.springframework", "Spring"),
    ],
    "build.gradle.kts": [
        ("spring-boot", "Spring Boot"),
        ("org.springframework", "Spring"),
    ],
    "Gemfile": [
        ("rails", "Ruby on Rails"),
        ("sinatra", "Sinatra"),
    ],
    "composer.json": [
        ("laravel", "Laravel"),
        ("symfony", "Symfony"),
    ],
}

# Extension rules: if these extensions appear in the file tree, add the label
_EXTENSION_RULES: dict[str, str] = {
    ".py": "Python",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".go": "Go",
    ".rs": "Rust",
    ".java": "Java",
    ".kt": "Kotlin",
    ".cs": "C#",
    ".cpp": "C++",
    ".c": "C",
    ".h": "C/C++",
    ".rb": "Ruby",
    ".php": "PHP",
    ".swift": "Swift",
    ".dart": "Dart",
    ".scala": "Scala",
    ".ex": "Elixir",
    ".exs": "Elixir",
    ".hs": "Haskell",
    ".lua": "Lua",
    ".r": "R",
    ".R": "R",
    ".jl": "Julia",
    ".tf": "Terraform",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".sql": "SQL",
    ".sh": "Shell",
    ".bash": "Shell",
    ".zsh": "Shell",
    ".ps1": "PowerShell",
}

# Database / store detection via file presence
_DB_RULES: dict[str, str] = {
    "docker-compose.yml": "",   # handled separately via content
    "docker-compose.yaml": "",
}

_DB_CONTENT_RULES: dict[str, list[tuple[str, str]]] = {
    "docker-compose.yml": [
        ("postgres", "PostgreSQL"),
        ("mysql", "MySQL"),
        ("mariadb", "MariaDB"),
        ("redis", "Redis"),
        ("mongodb", "MongoDB"),
        ("elasticsearch", "Elasticsearch"),
        ("cassandra", "Cassandra"),
        ("rabbitmq", "RabbitMQ"),
        ("kafka", "Kafka"),
    ],
    "docker-compose.yaml": [
        ("postgres", "PostgreSQL"),
        ("mysql", "MySQL"),
        ("redis", "Redis"),
        ("mongodb", "MongoDB"),
        ("rabbitmq", "RabbitMQ"),
        ("kafka", "Kafka"),
    ],
}


# ---------------------------------------------------------------------------
# Public function
# ---------------------------------------------------------------------------

def analyze_repository(repo_root: Path) -> StructuralAnalysisResult:
    """
    Walk ``repo_root`` and return a :class:`StructuralAnalysisResult`.

    Never executes any files. Only reads file content for well-known manifest
    files, and only up to ``MAX_FILE_READ_BYTES``.
    """
    result = StructuralAnalysisResult()

    if not repo_root.is_dir():
        return result

    # Collect top-level directories
    try:
        for entry in repo_root.iterdir():
            if entry.is_dir() and entry.name not in IGNORED_DIRS:
                result.top_level_dirs.append(entry.name)
    except OSError:
        pass
    result.top_level_dirs.sort()

    # Track which manifest files we found for content-based detection
    # filename (basename) → absolute path
    manifest_paths: dict[str, Path] = {}

    file_count = 0
    dir_count = 0
    ext_counts: dict[str, int] = {}

    for dirpath, dirnames, filenames in os.walk(repo_root, topdown=True):
        # Prune ignored directories in-place so os.walk doesn't descend
        dirnames[:] = [
            d for d in dirnames
            if d not in IGNORED_DIRS and not d.startswith(".")
            # allow .github explicitly for CI detection
            or d == ".github"
        ]
        # Resolve once; skip if it somehow escapes the root
        try:
            current = Path(dirpath).resolve()
            repo_root_resolved = repo_root.resolve()
            current.relative_to(repo_root_resolved)  # raises if outside
        except ValueError:
            continue

        dir_count += len(dirnames)

        for fname in filenames:
            if file_count >= MAX_FILES_INSPECTED:
                result.truncated = True
                break

            fpath = Path(dirpath) / fname
            ext = fpath.suffix.lower()

            # Count the file
            file_count += 1

            if ext not in BINARY_EXTENSIONS:
                ext_counts[ext] = ext_counts.get(ext, 0) + 1

            # Track manifest files (only keep first occurrence)
            if fname in _FILE_PRESENCE_RULES or fname in _FILE_CONTENT_RULES or fname in _DB_CONTENT_RULES:
                if fname not in manifest_paths:
                    manifest_paths[fname] = fpath
                    result.manifest_files.append(
                        str(fpath.relative_to(repo_root))
                    )

        if result.truncated:
            break

    result.file_count = file_count
    result.directory_count = dir_count
    result.extension_counts = ext_counts

    # -------------------------------------------------------------------------
    # Technology detection
    # -------------------------------------------------------------------------
    tech_set: set[str] = set()

    # 1. File-presence rules
    for fname, labels in _FILE_PRESENCE_RULES.items():
        if fname in manifest_paths or (repo_root / fname).exists():
            tech_set.update(labels)

    # 2. Extension-presence rules (only add language if meaningful count)
    for ext, label in _EXTENSION_RULES.items():
        if ext_counts.get(ext, 0) > 0 and label not in tech_set:
            tech_set.add(label)

    # 3. File-content rules (read safe portion of known manifests)
    for fname, checks in _FILE_CONTENT_RULES.items():
        fpath = manifest_paths.get(fname) or (repo_root / fname)
        if not fpath.is_file():
            continue
        try:
            raw = fpath.read_bytes()[:MAX_FILE_READ_BYTES].decode(
                "utf-8", errors="replace"
            ).lower()
            for search_str, label in checks:
                if search_str.lower() in raw:
                    tech_set.add(label)
        except OSError:
            pass

    # 4. DB / infra content rules
    for fname, checks in _DB_CONTENT_RULES.items():
        fpath = manifest_paths.get(fname) or (repo_root / fname)
        if not fpath.is_file():
            continue
        try:
            raw = fpath.read_bytes()[:MAX_FILE_READ_BYTES].decode(
                "utf-8", errors="replace"
            ).lower()
            for search_str, label in checks:
                if search_str.lower() in raw:
                    tech_set.add(label)
        except OSError:
            pass

    # Sort for determinism; remove empty strings
    result.technologies = sorted(t for t in tech_set if t)

    return result
