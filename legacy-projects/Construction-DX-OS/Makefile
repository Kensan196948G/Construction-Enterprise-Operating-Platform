.PHONY: sdk sdk-check sdk-ts sdk-py openapi lint test dev-install prod-up prod-down prod-validate help

PYTHON ?= python3
SCRIPTS = scripts

help:
	@echo "Available targets:"
	@echo "  dev-install      Create venvs and install all dev dependencies"
	@echo "  sdk              Generate TypeScript + Python client SDKs"
	@echo "  sdk-ts           Generate TypeScript SDK only"
	@echo "  sdk-py           Generate Python SDK only"
	@echo "  sdk-check        Verify SDKs are up to date with openapi.json"
	@echo "  openapi          (Re)generate server/api/openapi.json"
	@echo "  lint             Run ruff on agent + server"
	@echo "  test             Run pytest on agent + server"
	@echo ""
	@echo "Production targets (require .env.prod):"
	@echo "  prod-validate    Validate docker-compose.prod.yml config"
	@echo "  prod-up          Start production stack"
	@echo "  prod-down        Stop production stack"

dev-install:
	@echo "==> Setting up agent venv"
	$(PYTHON) -m venv agent/.venv
	agent/.venv/bin/pip install -q --upgrade pip
	agent/.venv/bin/pip install -q -e "agent/cdx_agent[dev]"
	@echo "==> Setting up server venv"
	$(PYTHON) -m venv server/api/.venv
	server/api/.venv/bin/pip install -q --upgrade pip
	server/api/.venv/bin/pip install -q -e "server/api[dev]"
	@echo "==> Dev install complete. Activate with: source server/api/.venv/bin/activate"

openapi:
	$(PYTHON) $(SCRIPTS)/generate_openapi.py

sdk: openapi
	$(PYTHON) $(SCRIPTS)/generate_sdk.py

sdk-ts: openapi
	$(PYTHON) $(SCRIPTS)/generate_sdk.py --lang ts

sdk-py: openapi
	$(PYTHON) $(SCRIPTS)/generate_sdk.py --lang py

sdk-check:
	$(PYTHON) $(SCRIPTS)/generate_sdk.py --check

lint:
	cd agent/cdx_agent && ../.venv/bin/ruff check cdx_agent tests
	cd server/api && .venv/bin/ruff check cdx_server tests

test:
	cd agent/cdx_agent && ../.venv/bin/pytest tests/ -q
	cd server/api && .venv/bin/pytest tests/ -q

prod-validate:
	@test -f .env.prod || (echo "ERROR: .env.prod not found — copy .env.prod.example and fill values" && exit 1)
	docker compose -f docker-compose.prod.yml --env-file .env.prod config --quiet
	@echo "✓ docker-compose.prod.yml is valid"

prod-up:
	@test -f .env.prod || (echo "ERROR: .env.prod not found — copy .env.prod.example and fill values" && exit 1)
	docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

prod-down:
	docker compose -f docker-compose.prod.yml down
