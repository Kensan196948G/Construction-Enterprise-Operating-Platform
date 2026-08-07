"""Runtime auth/authz flow verification for the construction service.

Exercises the JWT auth guard on a protected endpoint against a *running*
instance, proving the auth mechanism behaves fail-closed:

  1. no credentials        -> 401  (auth required / fail-closed)
  2. malformed token       -> 401  (invalid token rejected)
  3. non-"user" token type -> 403  (authorization by token type)
  4. valid user token      -> 200  (authenticated + authorized, hits real DB)

Usage (point at a running uvicorn instance using the same JWT key):
    BASE_URL=http://127.0.0.1:18090 \
    JWT_KEY=dev-only-do-not-use-in-production \
        python verify_auth_flow.py
"""

import os
import sys
import uuid

import httpx
from jose import jwt

BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:18090")
JWT_KEY = os.environ.get("JWT_KEY", "dev-only-do-not-use-in-production")
ALG = os.environ.get("JWT_ALGORITHM", "HS256")

ENDPOINT = f"{BASE_URL}/api/v1/construction/wbs?project_id={uuid.uuid4()}"

user_token = jwt.encode(
    {"sub": "u1", "type": "user", "org": "o1", "roles": ["pm"]}, JWT_KEY, algorithm=ALG
)
client_token = jwt.encode({"sub": "c1", "type": "client"}, JWT_KEY, algorithm=ALG)

cases = [
    ("no credentials -> 401", {}, 401),
    ("malformed token -> 401", {"Authorization": "Bearer invalid.token.xxx"}, 401),
    ("client-type token -> 403", {"Authorization": f"Bearer {client_token}"}, 403),
    ("valid user token -> 200", {"Authorization": f"Bearer {user_token}"}, 200),
]

failures = 0
with httpx.Client(timeout=10) as client:
    for label, headers, expected in cases:
        resp = client.get(ENDPOINT, headers=headers)
        ok = resp.status_code == expected
        print(f"{'✅' if ok else '❌'} {label}: got {resp.status_code}")
        if not ok:
            failures += 1

if failures:
    print(f"\n🔴 auth flow FAILED ({failures} case(s))")
    sys.exit(1)
print("\n🟢 auth/authz flow PASSED (fail-closed enforced, user token authorized)")
