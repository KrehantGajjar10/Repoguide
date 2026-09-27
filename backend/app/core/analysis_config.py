"""
Static configuration for the repository analysis pipeline.

All limits here are deliberately conservative to protect the local machine
from large or pathological public repositories.
"""

# ---------------------------------------------------------------------------
# Clone limits
# ---------------------------------------------------------------------------

# Seconds to wait for `git clone --depth 1` before aborting
CLONE_TIMEOUT_SECONDS: int = 120

# Maximum repository disk-usage (bytes) allowed after cloning.
# 200 MB — repositories larger than this are rejected.
MAX_REPO_SIZE_BYTES: int = 200 * 1024 * 1024

# Maximum number of files that will be inspected (walk is cut off after this)
MAX_FILES_INSPECTED: int = 10_000

# Maximum size (bytes) of a single file that will be read for content checks.
# Files larger than this are counted but their content is not examined.
MAX_FILE_READ_BYTES: int = 512 * 1024  # 512 KB

# ---------------------------------------------------------------------------
# Directories to skip entirely during the structural walk
# ---------------------------------------------------------------------------
IGNORED_DIRS: frozenset[str] = frozenset(
    {
        ".git",
        "node_modules",
        "dist",
        "build",
        ".next",
        ".vite",
        "coverage",
        "__pycache__",
        ".venv",
        "venv",
        "env",
        ".env",
        "target",
        "vendor",
        ".mypy_cache",
        ".ruff_cache",
        ".pytest_cache",
        ".tox",
        ".eggs",
        "*.egg-info",
        ".idea",
        ".vscode",
        "out",
        "tmp",
        "temp",
        "logs",
        ".cache",
        "htmlcov",
    }
)

# ---------------------------------------------------------------------------
# Binary / unreadable file extensions — counted but not content-inspected
# ---------------------------------------------------------------------------
BINARY_EXTENSIONS: frozenset[str] = frozenset(
    {
        # Images
        ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg",
        ".bmp", ".tiff",
        # Fonts
        ".ttf", ".woff", ".woff2", ".eot", ".otf",
        # Archives
        ".zip", ".tar", ".gz", ".bz2", ".xz", ".7z", ".rar",
        # Compiled / binary
        ".pyc", ".pyo", ".class", ".jar", ".war", ".ear",
        ".exe", ".dll", ".so", ".dylib", ".a", ".lib",
        ".bin", ".o",
        # Media
        ".mp3", ".mp4", ".wav", ".avi", ".mov", ".mkv",
        # Data blobs
        ".pdf", ".doc", ".docx", ".xls", ".xlsx",
        ".db", ".sqlite", ".sqlite3",
        # Lock files (not useful for tech detection)
        ".lock",
    }
)
