"""Hardcoded-secret baseline.

Scans `services/` for plausibly hardcoded credentials. The intent is not to
replace a real secret manager — it is to lock the current zero-baseline so
that future commits cannot silently introduce a real-looking secret.

The matcher is intentionally conservative:
- only `.py` files under services/ (excluding tests/) are scanned
- only assignments of the form `KEY = "VALUE"` / `KEY: TYPE = "VALUE"` are
  considered; pure type annotations and parameter defaults of `""` are not
- short values (< 8 chars) and clearly-placeholder values are ignored
- AWS-style keys (`AKIA...`) and PEM private-key headers are matched without
  a length floor since their shape itself is the signal
"""
from __future__ import annotations

import re
from collections.abc import Iterable
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SERVICES_ROOT = REPO_ROOT / "services"

SUSPICIOUS_NAMES = (
    "password",
    "passwd",
    "pwd",
    "secret",
    "secret_key",
    "api_key",
    "apikey",
    "access_token",
    "auth_token",
    "private_key",
    "client_secret",
)

ASSIGNMENT_RE = re.compile(
    r"""(?ix)
    ^\s*
    (?P<name>[A-Za-z_][A-Za-z0-9_]*)
    \s*(?::\s*[^=]+)?\s*
    =\s*
    (?P<quote>['"])(?P<value>.*?)(?P=quote)
    \s*$
    """,
)

AWS_KEY_RE = re.compile(r"\bAKIA[0-9A-Z]{16}\b")
PEM_HEADER_RE = re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH |)PRIVATE KEY-----")

PLACEHOLDER_TOKENS = (
    "placeholder",
    "example",
    "your-",
    "your_",
    "changeme",
    "change-me",
    "dummy",
    "fake",
    "todo",
    "xxxx",
    "<",  # <PASSWORD>, <TOKEN>, etc.
    "test",
    "sample",
    "default",
    "redacted",
)


def _iter_python_files(root: Path) -> Iterable[Path]:
    for path in root.rglob("*.py"):
        parts = set(path.parts)
        if "tests" in parts or "__pycache__" in parts or ".venv" in parts:
            continue
        yield path


def _is_suspicious_name(name: str) -> bool:
    lowered = name.lower()
    return any(token in lowered for token in SUSPICIOUS_NAMES)


def _looks_like_placeholder(value: str) -> bool:
    if len(value) < 8:
        return True
    lowered = value.lower()
    return any(token in lowered for token in PLACEHOLDER_TOKENS)


def _scan_file(path: Path) -> list[tuple[int, str, str]]:
    findings: list[tuple[int, str, str]] = []
    text = path.read_text(encoding="utf-8", errors="replace")
    for lineno, line in enumerate(text.splitlines(), start=1):
        stripped = line.lstrip()
        if stripped.startswith("#"):
            continue
        if AWS_KEY_RE.search(line) or PEM_HEADER_RE.search(line):
            findings.append((lineno, "key-pattern", line.strip()))
            continue
        match = ASSIGNMENT_RE.match(line)
        if not match:
            continue
        name = match.group("name")
        value = match.group("value")
        if not _is_suspicious_name(name):
            continue
        if _looks_like_placeholder(value):
            continue
        findings.append((lineno, name, value))
    return findings


def test_no_hardcoded_secrets_in_services() -> None:
    """Baseline: no plausibly real secrets are committed under services/."""
    assert SERVICES_ROOT.is_dir(), f"services/ not found at {SERVICES_ROOT}"
    offenders: list[str] = []
    for py in _iter_python_files(SERVICES_ROOT):
        for lineno, name, value in _scan_file(py):
            rel = py.relative_to(REPO_ROOT)
            preview = value if len(value) <= 40 else value[:37] + "..."
            offenders.append(f"{rel}:{lineno} [{name}] {preview}")
    assert not offenders, (
        "Hardcoded secret-like values detected. If these are intentional "
        "placeholders, mark them with 'placeholder' / 'example' / 'TODO' / "
        "'changeme' or move them under tests/. Findings:\n  - "
        + "\n  - ".join(offenders)
    )


def test_scanner_detects_real_looking_secret(tmp_path: Path) -> None:
    """Self-test: scanner must flag an obvious hardcoded password."""
    sample = tmp_path / "leak.py"
    sample.write_text('PASSWORD = "S3cretP@ssw0rd!"\n', encoding="utf-8")
    findings = _scan_file(sample)
    assert findings, "scanner failed to detect an obvious hardcoded password"


def test_scanner_ignores_placeholder(tmp_path: Path) -> None:
    """Self-test: scanner must not flag a clearly marked placeholder."""
    sample = tmp_path / "ok.py"
    sample.write_text('PASSWORD = "your-password-here"\n', encoding="utf-8")
    findings = _scan_file(sample)
    assert not findings, f"scanner false-positive on placeholder: {findings}"
