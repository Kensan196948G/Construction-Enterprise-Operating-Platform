"""Security scan tests — pip-audit + bandit results validation.

These tests verify that known security checks pass.
Run as part of CI quality gate.

Notes
-----
pip-audit is run against a curated requirements snapshot that contains only
the packages declared in server/api/pyproject.toml (direct + transitive).
The system-wide ``bcc`` and ``cloud-init`` packages, which are OS-managed and
cannot be audited via PyPI, are intentionally excluded.

bandit is run against the cdx_server package with ``-ll`` (LOW+MEDIUM+HIGH)
but the test only fails on HIGH severity findings, consistent with the project
security policy (LOW findings in admin_auth.py / auth.py / schemas.py are
false-positives for environment-variable name constants).
"""

from __future__ import annotations

import os
import subprocess
import sys

import pytest

# Absolute path to server/api so tests work regardless of cwd
SERVER_API_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "../../server/api")
)

# Packages that are OS-managed and cannot be resolved via PyPI.
# Excluding them prevents pip-audit from aborting with a lookup error.
_PYPI_EXCLUDED = {"bcc", "cloud-init", "command-not-found"}

# Disputed / no-fix-available vulnerabilities accepted as known risk.
# Each entry: (vuln_id, reason)
_IGNORED_VULNS = [
    (
        "PYSEC-2025-183",
        # Disputed by PyJWT supplier: key length is the caller's responsibility.
        # No fix version available as of 2026-05. Tracked in Issue #PYJWT-DISPUTED.
        # Our usage (oidc_auth.py) decodes tokens from an external OIDC provider;
        # we do not generate keys, so the risk is minimal.
        "disputed, no fix available, minimal risk in decode-only usage",
    ),
]

# Core project dependencies to audit (direct + key transitive deps).
# Derived from pyproject.toml [project] dependencies section.
_AUDIT_PACKAGES = [
    "fastapi",
    "pydantic",
    "uvicorn",
    "starlette",
    "anyio",
    "h11",
    "httpx",
    "httpcore",
    "idna",
    "certifi",
    "sniffio",
    "cryptography",
    "PyJWT",
    "sqlalchemy",
    "alembic",
    "jinja2",
    "MarkupSafe",
    "python-multipart",
    "asyncpg",
    "aiosqlite",
    "sse-starlette",
    "annotated-types",
    "typing-extensions",
]


def _build_audit_requirements() -> str:
    """Return a requirements.txt string for the packages we want to audit.

    We ask pip to report the installed version of each package so the audit
    uses the *actually installed* versions rather than the minimum constraints
    declared in pyproject.toml.
    """
    result = subprocess.run(
        [sys.executable, "-m", "pip", "show"] + _AUDIT_PACKAGES,
        capture_output=True,
        text=True,
    )
    lines: list[str] = []
    name = version = ""
    for line in result.stdout.splitlines():
        if line.startswith("Name:"):
            name = line.split(":", 1)[1].strip()
        elif line.startswith("Version:"):
            version = line.split(":", 1)[1].strip()
        elif line == "---":
            if name and version:
                lines.append(f"{name}=={version}")
            name = version = ""
    if name and version:
        lines.append(f"{name}=={version}")
    return "\n".join(lines) + "\n"


def test_pip_audit_no_known_vulnerabilities(tmp_path: "pytest.TempPathFactory") -> None:
    """pip-audit must report no known vulnerabilities in project dependencies."""
    req_file = tmp_path / "requirements_audit.txt"
    req_file.write_text(_build_audit_requirements())

    ignore_flags: list[str] = []
    for vuln_id, _ in _IGNORED_VULNS:
        ignore_flags += ["--ignore-vuln", vuln_id]

    result = subprocess.run(
        [sys.executable, "-m", "pip_audit", "-r", str(req_file)] + ignore_flags,
        capture_output=True,
        text=True,
    )
    output = result.stdout + result.stderr
    assert result.returncode == 0, (
        f"pip-audit found vulnerabilities in project dependencies:\n{output}"
    )


def test_bandit_no_high_severity() -> None:
    """bandit must report no HIGH severity issues in cdx_server/.

    LOW severity findings in admin_auth.py, auth.py, schemas.py are false
    positives (bandit B105: environment variable name strings that match
    password-like patterns).  They are accepted risks; only HIGH warrants a
    blocker.
    """
    result = subprocess.run(
        [sys.executable, "-m", "bandit", "-r", "cdx_server/", "-ll", "--exit-zero"],
        cwd=SERVER_API_DIR,
        capture_output=True,
        text=True,
    )
    output = result.stdout + result.stderr
    assert "Severity: HIGH" not in output, (
        f"bandit found HIGH severity issues in cdx_server/:\n{output}"
    )


def test_bandit_no_medium_severity() -> None:
    """bandit must report no MEDIUM severity issues in cdx_server/."""
    result = subprocess.run(
        [sys.executable, "-m", "bandit", "-r", "cdx_server/", "-ll", "--exit-zero"],
        cwd=SERVER_API_DIR,
        capture_output=True,
        text=True,
    )
    output = result.stdout + result.stderr
    assert "Severity: MEDIUM" not in output, (
        f"bandit found MEDIUM severity issues in cdx_server/:\n{output}"
    )


def test_ruff_no_issues() -> None:
    """ruff check must pass cleanly on the cdx_server package."""
    result = subprocess.run(
        [sys.executable, "-m", "ruff", "check", "."],
        cwd=SERVER_API_DIR,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, (
        f"ruff found lint/style issues:\n{result.stdout}\n{result.stderr}"
    )


def _get_csp_via_http() -> str:
    """Get CSP header by making a real HTTP request via TestClient."""
    import sys
    sys.path.insert(0, os.path.join(SERVER_API_DIR))
    from cdx_server.app import create_app  # noqa: PLC0415
    from fastapi.testclient import TestClient  # noqa: PLC0415

    with TestClient(create_app()) as client:
        resp = client.get("/health")
        return resp.headers.get("content-security-policy", "")


def test_csp_no_unsafe_inline_in_default_src() -> None:
    """CSP default-src must not contain 'unsafe-inline' or 'unsafe-eval'.

    These relaxations are scoped to script-src only (temporary, tracked in
    Issue 0043/0044).  If they ever bleed into default-src, this test will
    catch the regression.

    Uses HTTP response (not internal implementation) for resilience to refactors.
    """
    csp_value = _get_csp_via_http()
    assert csp_value, "CSP header not found in HTTP response"

    for directive in csp_value.split(";"):
        directive = directive.strip()
        if directive.startswith("default-src"):
            assert "'unsafe-inline'" not in directive, (
                f"'unsafe-inline' must not appear in default-src: {directive!r}"
            )
            assert "'unsafe-eval'" not in directive, (
                f"'unsafe-eval' must not appear in default-src: {directive!r}"
            )
            assert "*" not in directive, (
                f"Wildcard must not appear in default-src: {directive!r}"
            )
            break


def test_csp_frame_ancestors_none() -> None:
    """CSP must contain frame-ancestors 'none' to prevent clickjacking.

    Uses HTTP response (not internal implementation) for resilience to refactors.
    """
    csp_value = _get_csp_via_http()
    assert "frame-ancestors 'none'" in csp_value, (
        f"CSP must include \"frame-ancestors 'none'\": {csp_value!r}"
    )
