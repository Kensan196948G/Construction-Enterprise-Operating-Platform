"""Observability primitives for cdx-agent.

Mirrors the interface shape of :mod:`cdx_server.obs` so logs from both
sides can be ingested by the same pipeline (same record schema, same
request-id correlation convention).
"""
